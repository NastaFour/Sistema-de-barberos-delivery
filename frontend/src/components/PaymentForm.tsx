import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { api } from '../lib/api';

interface Props {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function PaymentForm({ bookingId, amount, onSuccess, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL not needed for mobile — handled inline
        return_url: `${window.location.origin}/bookings`,
      },
      redirect: 'if_required',
    });

    if (error) {
      const msg = error.message ?? 'Error al procesar el pago';
      setMessage(msg);
      onError(msg);
    } else {
      // Confirm on backend (webhook is source of truth, this is for immediate UX)
      try {
        const pi = await stripe.retrievePaymentIntent(
          elements.getElement('payment')?.['_parent']?.['_stripe']?.['_paymentIntent']?.['clientSecret'] ?? ''
        );
        if (pi.paymentIntent?.id) {
          await api.post('/payments/confirm', { paymentIntentId: pi.paymentIntent.id });
        }
      } catch {
        // Webhook will handle async; don't block the user
      }
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: { billingDetails: {} },
          }}
        />
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-500 px-4 py-3 text-red-400 text-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full py-4 rounded-xl font-bold text-base bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
            Procesando...
          </>
        ) : (
          `Pagar $${amount.toFixed(2)}`
        )}
      </button>

      <p className="text-center text-xs text-gray-500 mt-3">
        🔒 Pago seguro con Stripe. Nunca guardamos tus datos de tarjeta.
      </p>
    </form>
  );
}
