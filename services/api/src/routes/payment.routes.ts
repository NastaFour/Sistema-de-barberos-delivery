import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { apiResponse } from '../utils/response';
import {
  createPaymentIntent,
  confirmPayment,
  createBarberConnectAccount,
  getBarberOnboardingLink,
  handleWebhook,
  stripe,
} from '../services/stripe.service';

const router = Router();

// ── POST /api/payments/create-intent ──────────────────
// Auth: CLIENT
router.post('/create-intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const { bookingId } = req.body as { bookingId: string };

    if (!bookingId) {
      apiResponse.error(res, 'bookingId requerido', 400);
      return;
    }

    // Verify booking belongs to client
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, clientId: userId },
      include: {
        barber: { select: { stripeAccountId: true, stripeAccountStatus: true, user: { select: { name: true } } } },
      },
    });

    if (!booking) {
      apiResponse.error(res, 'Reserva no encontrada', 404);
      return;
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      apiResponse.error(res, 'Esta reserva ya fue procesada', 400);
      return;
    }

    if (!booking.barber.stripeAccountId || booking.barber.stripeAccountStatus !== 'active') {
      apiResponse.error(res, 'El barbero aún no tiene cuenta de pagos activa', 400);
      return;
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      booking.id,
      booking.total,
      booking.barber.stripeAccountId,
    );

    apiResponse.success(res, { clientSecret, paymentIntentId });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/payments/confirm ────────────────────────
// Auth: CLIENT
router.post('/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId } = req.body as { paymentIntentId: string };

    if (!paymentIntentId) {
      apiResponse.error(res, 'paymentIntentId requerido', 400);
      return;
    }

    const result = await confirmPayment(paymentIntentId);
    apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
});

// ── POST /api/payments/webhook ────────────────────────
// PUBLIC — raw body required
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  try {
    await handleWebhook(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${(error as Error).message}`);
  }
});

// ── POST /api/payments/connect-account ───────────────
// Auth: BARBER
router.post('/connect-account', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'BARBER') {
      apiResponse.error(res, 'Solo para barberos', 403);
      return;
    }

    const profile = await prisma.barberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, stripeAccountId: true, stripeAccountStatus: true },
    });

    if (!profile) {
      apiResponse.error(res, 'Perfil de barbero no encontrado', 404);
      return;
    }

    // If already has account, generate new onboarding link
    if (profile.stripeAccountId) {
      const onboardingUrl = await getBarberOnboardingLink(profile.stripeAccountId);
      apiResponse.success(res, { onboardingUrl, accountId: profile.stripeAccountId });
      return;
    }

    const result = await createBarberConnectAccount(profile.id, user.email);
    apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/payments/connect-status ─────────────────
// Auth: BARBER
router.get('/connect-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'BARBER') {
      apiResponse.error(res, 'Solo para barberos', 403);
      return;
    }

    const profile = await prisma.barberProfile.findUnique({
      where: { userId: user.id },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    });

    if (!profile) {
      apiResponse.error(res, 'Perfil no encontrado', 404);
      return;
    }

    let onboardingUrl: string | undefined;
    if (profile.stripeAccountId && profile.stripeAccountStatus !== 'active') {
      onboardingUrl = await getBarberOnboardingLink(profile.stripeAccountId);
    }

    apiResponse.success(res, {
      status: profile.stripeAccountStatus ?? 'not_connected',
      hasAccount: !!profile.stripeAccountId,
      onboardingUrl,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
