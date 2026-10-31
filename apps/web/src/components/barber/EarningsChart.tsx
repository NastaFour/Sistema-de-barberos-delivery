import type { Booking } from "@barber-delivery/shared-types";
import { format, isSameDay, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface EarningsChartProps {
  bookings: Booking[];
}

interface DayEarning {
  date: Date;
  label: string;
  amount: number;
}

export function EarningsChart({ bookings }: EarningsChartProps) {
  const today = startOfDay(new Date());

  const last7Days: DayEarning[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayAmount = bookings
      .filter((b) => isSameDay(new Date(b.scheduledAt), date))
      .reduce((sum, b) => sum + (b.services?.reduce((s, bs) => s + bs.price, 0) || 0), 0);
    return {
      date,
      label: format(date, "EEE", { locale: es }).replace(".", ""),
      amount: dayAmount,
    };
  });

  const maxAmount = Math.max(...last7Days.map((d) => d.amount), 1);
  const chartHeight = 140;
  const chartWidth = 300;
  const barWidth = 28;
  const gap = (chartWidth - 7 * barWidth) / 6;
  const totalWeek = last7Days.reduce((sum, d) => sum + d.amount, 0);

  if (totalWeek === 0) {
    return (
      <div className="w-full bg-dark-900 border border-dark-800 rounded-lg p-6">
        <p className="text-gray-400 text-sm mb-4">Ingresos de la semana</p>
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
          Sin ingresos esta semana
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-dark-900 border border-dark-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">Ingresos de la semana</p>
        <p className="text-primary font-semibold">${totalWeek.toFixed(2)}</p>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = chartHeight - pct * chartHeight;
          return (
            <g key={`grid-${pct}`}>
              <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#1f2937" strokeWidth="1" />
              <text x="0" y={y - 4} fill="#6b7280" fontSize="10">
                ${(maxAmount * pct).toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {last7Days.map((day, i) => {
          const barHeight = (day.amount / maxAmount) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;
          const isToday = i === 6;

          return (
            <g key={`bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={isToday ? "#8b5cf6" : "#6366f1"}
                opacity={isToday ? 1 : 0.7}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                fill="#9ca3af"
                fontSize="10"
                textAnchor="middle"
              >
                {day.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
