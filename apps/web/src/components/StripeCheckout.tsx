import { Elements } from "@stripe/react-stripe-js";
import { type Stripe, loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PaymentForm } from "./PaymentForm";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (key && key !== "pk_test_placeholder") {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

interface Props {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
}

export function StripeCheckout({ bookingId, amount, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const stripeInstance = getStripe();

  useEffect(() => {
    if (!stripeInstance) {
      setError("Stripe no esta configurado. Contacta al administrador.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await api.post<{ success: boolean; data: { clientSecret: string } }>(
          "/payments/create-intent",
          { bookingId },
        );
        if (res.data.success) {
          setClientSecret(res.data.data.clientSecret);
        } else {
          setError("No se pudo iniciar el pago. Intentalo de nuevo.");
        }
      } catch {
        setError("Error al conectar con el servicio de pagos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, stripeInstance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
        <span className="animate-spin h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full" />
        Preparando pago seguro...
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="rounded-xl bg-red-900/20 border border-red-500 p-4 text-red-400 text-sm">
        {error ?? "Error desconocido."}
      </div>
    );
  }

  return (
    <Elements
      stripe={stripeInstance}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#f59e0b",
            colorBackground: "#111827",
            colorText: "#f3f4f6",
            colorDanger: "#ef4444",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm
        bookingId={bookingId}
        amount={amount}
        onSuccess={onSuccess}
        onError={(msg) => setError(msg)}
      />
    </Elements>
  );
}
