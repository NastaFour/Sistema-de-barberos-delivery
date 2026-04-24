import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import {
  createPaymentIntent,
  confirmPayment,
  createBarberConnectAccount,
  getBarberOnboardingLink,
  handleWebhook,
  stripe,
} from '../services/stripe.service';

const router = Router();
const prisma = new PrismaClient();

// ── POST /api/payments/create-intent ──────────────────
// Auth: CLIENT
router.post('/create-intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as Request & { user?: { id: string; role: string } }).user?.id;
    const { bookingId } = req.body as { bookingId: string };

    if (!bookingId) {
      res.status(400).json({ success: false, error: 'bookingId requerido' });
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
      res.status(404).json({ success: false, error: 'Reserva no encontrada' });
      return;
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      res.status(400).json({ success: false, error: 'Esta reserva ya fue procesada' });
      return;
    }

    if (!booking.barber.stripeAccountId || booking.barber.stripeAccountStatus !== 'active') {
      res.status(400).json({ success: false, error: 'El barbero aún no tiene cuenta de pagos activa' });
      return;
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      booking.id,
      booking.total,
      booking.barber.stripeAccountId,
    );

    res.json({ success: true, data: { clientSecret, paymentIntentId } });
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
      res.status(400).json({ success: false, error: 'paymentIntentId requerido' });
      return;
    }

    const result = await confirmPayment(paymentIntentId);
    res.json({ success: true, data: result });
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
    const user = (req as Request & { user?: { id: string; role: string; email: string } }).user;
    if (user?.role !== 'BARBER') {
      res.status(403).json({ success: false, error: 'Solo para barberos' });
      return;
    }

    const profile = await prisma.barberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, stripeAccountId: true, stripeAccountStatus: true },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: 'Perfil de barbero no encontrado' });
      return;
    }

    // If already has account, generate new onboarding link
    if (profile.stripeAccountId) {
      const onboardingUrl = await getBarberOnboardingLink(profile.stripeAccountId);
      res.json({ success: true, data: { onboardingUrl, accountId: profile.stripeAccountId } });
      return;
    }

    const result = await createBarberConnectAccount(profile.id, user.email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/payments/connect-status ─────────────────
// Auth: BARBER
router.get('/connect-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as Request & { user?: { id: string; role: string } }).user;
    if (user?.role !== 'BARBER') {
      res.status(403).json({ success: false, error: 'Solo para barberos' });
      return;
    }

    const profile = await prisma.barberProfile.findUnique({
      where: { userId: user.id },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: 'Perfil no encontrado' });
      return;
    }

    let onboardingUrl: string | undefined;
    if (profile.stripeAccountId && profile.stripeAccountStatus !== 'active') {
      onboardingUrl = await getBarberOnboardingLink(profile.stripeAccountId);
    }

    res.json({
      success: true,
      data: {
        status: profile.stripeAccountStatus ?? 'not_connected',
        hasAccount: !!profile.stripeAccountId,
        onboardingUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
