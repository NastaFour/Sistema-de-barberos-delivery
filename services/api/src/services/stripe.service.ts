import Stripe from 'stripe';
import prisma from '../config/db';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? 10) / 100;

// ── Create Payment Intent ─────────────────────────────
export async function createPaymentIntent(
  bookingId: string,
  amountFloat: number,
  barberStripeAccountId: string,
  currency = 'usd'
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const amountCents = Math.round(amountFloat * 100);
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT);
  const barberAmountCents = amountCents - platformFeeCents;

  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    application_fee_amount: platformFeeCents,
    transfer_data: { destination: barberStripeAccountId },
    metadata: { bookingId },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.payment.create({
    data: {
      bookingId,
      stripePaymentIntentId: pi.id,
      amount: amountCents,
      platformFee: platformFeeCents,
      barberAmount: barberAmountCents,
      status: 'PENDING',
    },
  });

  return { clientSecret: pi.client_secret!, paymentIntentId: pi.id };
}

// ── Confirm Payment ───────────────────────────────────
export async function confirmPayment(
  paymentIntentId: string
): Promise<{ success: boolean; status: string }> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const isSucceeded = pi.status === 'succeeded';
  const isCanceled  = pi.status === 'canceled';

  await prisma.$transaction(async (tx) => {
    const newPaymentStatus = isSucceeded ? 'COMPLETED' : isCanceled ? 'FAILED' : 'PROCESSING';
    await tx.payment.update({
      where: { stripePaymentIntentId: paymentIntentId },
      data: { status: newPaymentStatus },
    });
    if (isSucceeded || isCanceled) {
      const payment = await tx.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { bookingId: true },
      });
      if (payment) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: isSucceeded ? 'CONFIRMED' : 'CANCELLED' },
        });
      }
    }
  });

  return { success: isSucceeded, status: pi.status };
}

// ── Stripe Connect: Create Barber Account ─────────────
export async function createBarberConnectAccount(
  profileId: string,
  barberEmail: string
): Promise<{ onboardingUrl: string; accountId: string }> {
  const account = await stripe.accounts.create({
    type: 'express',
    email: barberEmail,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    metadata: { profileId },
  });

  await prisma.barberProfile.update({
    where: { id: profileId },
    data: { stripeAccountId: account.id, stripeAccountStatus: 'pending' },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/barber/earnings?stripe=refresh`,
    return_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/barber/earnings?stripe=success`,
    type: 'account_onboarding',
  });

  return { onboardingUrl: accountLink.url, accountId: account.id };
}

// ── Stripe Connect: Get Onboarding Link ──────────────
export async function getBarberOnboardingLink(stripeAccountId: string): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/barber/earnings?stripe=refresh`,
    return_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/barber/earnings?stripe=success`,
    type: 'account_onboarding',
  });
  return accountLink.url;
}

// ── Webhook Handler ───────────────────────────────────
export async function handleWebhook(payload: Buffer, signature: string): Promise<void> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is required');

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new Error('Invalid webhook signature');
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as any;
      const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: pi.id } });
      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } }),
          prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } }),
        ]);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as any;
      const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: pi.id } });
      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } }),
          prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'CANCELLED' } }),
        ]);
      }
      break;
    }
    case 'account.updated': {
      const account = event.data.object as any;
      const isActive = account.charges_enabled && account.payouts_enabled;
      await prisma.barberProfile.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeAccountStatus: isActive ? 'active' : 'pending' },
      });
      break;
    }
    default:
      break;
  }
}
