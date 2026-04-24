import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface ConnectStatus {
  status: string;
  hasAccount: boolean;
  onboardingUrl?: string;
}

export function StripeConnectBanner() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    api
      .get<{ success: boolean; data: ConnectStatus }>('/payments/connect-status')
      .then((res) => {
        if (res.data.success) setStatus(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await api.post<{ success: boolean; data: { onboardingUrl: string } }>(
        '/payments/connect-account'
      );
      if (res.data.success) {
        window.location.href = res.data.data.onboardingUrl;
      }
    } catch {
      setConnecting(false);
    }
  };

  if (loading || !status) return null;

  // Active — show success badge
  if (status.status === 'active') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-900/20 border border-green-700 px-5 py-3 text-green-400 text-sm font-medium">
        <CheckCircle size={18} />
        Cuenta Stripe conectada. Recibirás pagos automáticamente.
      </div>
    );
  }

  // Pending / not connected
  return (
    <div className="rounded-xl bg-amber-900/20 border border-amber-600 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1">
        <AlertCircle size={22} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-semibold text-sm">Conecta tu cuenta para recibir pagos</p>
          <p className="text-amber-200/70 text-xs mt-1">
            Sin una cuenta Stripe activa, los clientes no podrán reservarte. El proceso tarda ~2 minutos.
          </p>
        </div>
      </div>
      <button
        onClick={status.onboardingUrl ? () => { window.location.href = status.onboardingUrl!; } : handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-colors disabled:opacity-60 shrink-0"
      >
        {connecting ? (
          <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
        ) : (
          <ExternalLink size={15} />
        )}
        Conectar con Stripe
      </button>
    </div>
  );
}
