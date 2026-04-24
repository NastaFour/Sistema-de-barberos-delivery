import React from 'react';

// Un componente placeholder para el gráfico, ya que requiere recharts o chart.js
// Se puede implementar con recharts más adelante.
export function EarningsChart() {
  return (
    <div className="w-full h-64 bg-dark-900 border border-dark-800 rounded-lg flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-400 mb-2">Gráfico de Ingresos</p>
        <p className="text-sm text-gray-500 italic">
          (Requiere instalación de biblioteca gráfica como recharts)
        </p>
        <div className="flex h-32 items-end justify-center gap-2 mt-4 opacity-50">
          <div className="w-8 bg-primary rounded-t" style={{ height: '40%' }}></div>
          <div className="w-8 bg-primary rounded-t" style={{ height: '70%' }}></div>
          <div className="w-8 bg-primary rounded-t" style={{ height: '50%' }}></div>
          <div className="w-8 bg-primary rounded-t" style={{ height: '90%' }}></div>
          <div className="w-8 bg-primary rounded-t" style={{ height: '60%' }}></div>
          <div className="w-8 bg-primary rounded-t" style={{ height: '80%' }}></div>
          <div className="w-8 bg-primary rounded-t" style={{ height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
