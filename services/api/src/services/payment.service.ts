import Stripe from 'stripe';
import { prisma } from '../config/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

interface PaymentIntentData {
  bookingId: string;
  amount: number; // en centavos
  currency: string;
  customerId?: string;
}

/**
 * Crea un PaymentIntent de Stripe para una reserva
 */
export async function createPaymentIntent({
  bookingId,
  amount,
  currency = 'usd',
  customerId,
}: PaymentIntentData) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        bookingId,
        service: 'BarberGo',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Error creando PaymentIntent:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica el estado de un pago
 */
export async function verifyPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error: any) {
    console.error('Error verificando pago:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Confirma un pago y actualiza la reserva
 */
export async function confirmPayment(bookingId: string, paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        error: 'El pago no ha sido completado',
      };
    }

    // Actualizar la reserva con información del pago
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'PAID',
        paymentIntentId,
      },
    });

    return {
      success: true,
      message: 'Pago confirmado exitosamente',
    };
  } catch (error: any) {
    console.error('Error confirmando pago:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Procesa un reembolso
 */
export async function processRefund(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // Si es undefined, reembolsa el total
    });

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
    };
  } catch (error: any) {
    console.error('Error procesando reembolso:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Crea o recupera un cliente de Stripe
 */
export async function getOrCreateStripeCustomer(userId: string, email: string, name: string) {
  try {
    // Buscar si ya existe un cliente con este email
    const existingCustomers = await stripe.customers.list({ email });
    
    if (existingCustomers.data.length > 0) {
      return {
        success: true,
        customerId: existingCustomers.data[0].id,
      };
    }

    // Crear nuevo cliente
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return {
      success: true,
      customerId: customer.id,
    };
  } catch (error: any) {
    console.error('Error creando cliente Stripe:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calcula el monto total para Stripe (en centavos)
 */
export function calculateStripeAmount(subtotal: number, serviceFeePercent: number = 5): number {
  const serviceFee = subtotal * (serviceFeePercent / 100);
  const total = subtotal + serviceFee;
  
  // Convertir a centavos y redondear
  return Math.round(total * 100);
}
