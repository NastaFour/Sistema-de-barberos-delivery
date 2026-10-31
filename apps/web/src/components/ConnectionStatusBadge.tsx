import { Wifi, WifiOff } from "lucide-react";
import { useSocket } from "../hooks/useSocket";

export function ConnectionStatusBadge() {
  const { isConnected } = useSocket();

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      }`}
      title={isConnected ? "Conectado" : "Desconectado — reconectando..."}
    >
      {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      <span>{isConnected ? "En línea" : "Offline"}</span>
    </div>
  );
}
