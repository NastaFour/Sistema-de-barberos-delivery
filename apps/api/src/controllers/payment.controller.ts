import type { NextFunction, Request, Response } from "express";
import prisma from "../config/db";
import type { AuthRequest } from "../middleware/auth.middleware";
import {
  confirmPayment as confirmPaymentService,
  createBarberConnectAccount,
  createPaymentIntent,
  getBarberOnboardingLink,
  handleWebhook as handleWebhookService,
} from "../services/stripe.service";
import { apiResponse } from "../utils/apiResponse";

export async function createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const { bookingId } = req.body as { bookingId: string };

    if (!bookingId) {
      apiResponse.error(res, "bookingId requerido", undefined, 400);
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, clientId: userId },
      include: {
        barber: {
          select: {
            stripeAccountId: true,
            stripeAccountStatus: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) {
      apiResponse.error(res, "Reserva no encontrada", undefined, 404);
      return;
    }

    if (booking.status !== "PENDING_PAYMENT") {
      apiResponse.error(res, "Esta reserva ya fue procesada", undefined, 400);
      return;
    }

    if (!booking.barber.stripeAccountId || booking.barber.stripeAccountStatus !== "active") {
      apiResponse.error(res, "El barbero aún no tiene cuenta de pagos activa", undefined, 400);
      return;
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      booking.id,
      booking.total,
      booking.barber.stripeAccountId,
    );

    apiResponse.success(res, "ok", { clientSecret, paymentIntentId });
  } catch (error) {
    next(error);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { paymentIntentId } = req.body as { paymentIntentId: string };

    if (!paymentIntentId) {
      apiResponse.error(res, "paymentIntentId requerido", undefined, 400);
      return;
    }

    const result = await confirmPaymentService(paymentIntentId);
    apiResponse.success(res, "Pago confirmado", result);
  } catch (error) {
    next(error);
  }
}

export async function connectAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as AuthRequest).user?.userId;

    const barber = await prisma.barberProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });

    if (!barber) {
      apiResponse.error(res, "Perfil de barbero no encontrado", undefined, 404);
      return;
    }

    if (barber.stripeAccountId && barber.stripeAccountStatus === "active") {
      apiResponse.error(res, "Ya tienes una cuenta de Stripe activa", undefined, 400);
      return;
    }

    if (barber.stripeAccountId) {
      const onboardingUrl = await getBarberOnboardingLink(barber.stripeAccountId);
      apiResponse.success(res, "ok", { onboardingUrl });
      return;
    }

    const result = await createBarberConnectAccount(barber.id, barber.user.email);
    apiResponse.success(res, "Cuenta creada", result);
  } catch (error) {
    next(error);
  }
}

export async function connectStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as AuthRequest).user?.userId;

    const barber = await prisma.barberProfile.findUnique({
      where: { userId },
      select: { stripeAccountId: true, stripeAccountStatus: true },
    });

    if (!barber) {
      apiResponse.error(res, "Perfil de barbero no encontrado", undefined, 404);
      return;
    }

    apiResponse.success(res, "ok", {
      hasAccount: Boolean(barber.stripeAccountId),
      status: barber.stripeAccountStatus,
      accountId: barber.stripeAccountId,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  try {
    await handleWebhookService(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    res.status(400).send(`Webhook Error: ${message}`);
  }
}
