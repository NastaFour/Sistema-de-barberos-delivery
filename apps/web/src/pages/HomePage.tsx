import { ArrowRight, Award, Clock, Scissors, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layouts/DashboardLayout";

const stats = [
  { value: "50+", label: "Barberos Certificados" },
  { value: "5K+", label: "Cortes a Domicilio" },
  { value: "4.9", label: "Rating Promedio" },
  { value: "100%", label: "Garantía de Satisfacción" },
];

const features = [
  {
    icon: Clock,
    title: "Puntualidad en tu Puerta",
    desc: "Tu barbero llega a tu ubicación acordada con herramientas esterilizadas de nivel profesional.",
    badge: "Sin tráfico",
  },
  {
    icon: Shield,
    title: "Maestros Verificados",
    desc: "Cada barbero pasa por validación de antecedentes, portafolio de trabajo y pruebas de técnica.",
    badge: "100% Verificado",
  },
  {
    icon: Award,
    title: "Tarifas Transparentes",
    desc: "Precio cerrado antes de agendar. Sin costos ocultos, propina transparente y recibos claros.",
    badge: "Cero sorpresas",
  },
  {
    icon: Star,
    title: "Experiencia Atelier",
    desc: "Cuidado de barba, fade, corte clásico o estilismo completo adaptado a tu estilo personal.",
    badge: "Alta gama",
  },
];

const steps = [
  {
    num: "01",
    title: "Encuentra tu Barbero",
    desc: "Explora portfolios, calificaciones y ubicación en tiempo real en el mapa.",
  },
  {
    num: "02",
    title: "Elige Fecha y Slot",
    desc: "Selecciona el servicio y el horario que mejor encaja en tu agenda.",
  },
  {
    num: "03",
    title: "Reserva Segura",
    desc: "Pago protegido online con tarjeta o confirmación inmediata.",
  },
  {
    num: "04",
    title: "Corte Impecable",
    desc: "Tu barbero llega con equipo profesional y transforma tu imagen.",
  },
];

export default function HomePage() {
  return (
    <DashboardLayout>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16">
        {/* Glow ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass mb-8 border border-primary-500/20 shadow-glow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            <span className="text-primary-300 font-medium text-xs tracking-wider uppercase">
              Barberos listos para acudir a tu domicilio
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white tracking-tight leading-[1.08]">
            El arte de la barbería, <br />
            <span className="text-gradient">directamente en tu hogar</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-dark-300 max-w-2xl mx-auto leading-relaxed font-light">
            Conectamos clientes exigentes con barberos profesionales independientes. Sin
            desplazamientos ni salas de espera. Máxima precisión y confort.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/barbers"
              className="btn-primary group flex items-center gap-2.5 text-base px-8 py-3.5"
            >
              <span>Explorar Barberos Cercanos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register"
              className="btn-secondary flex items-center gap-2 text-base px-6 py-3.5"
            >
              <Scissors className="w-4 h-4 text-primary-400" />
              <span>Unirse como Barbero</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-dark-800/80 pt-10">
            {stats.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
                  {s.value}
                </span>
                <span className="text-xs sm:text-sm text-dark-400 mt-1 uppercase tracking-wider font-medium">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-dark-900/40 border-y border-dark-800/60 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Diseñado para el confort absoluto
            </h2>
            <p className="text-dark-300 mt-3 text-base">
              Estándares de higiene hospitalaria, herramientas de precisión y barberos apasionados
              por el oficio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="card-dark group hover:border-primary-500/40 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-5 group-hover:scale-105 transition-transform">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mb-2">{f.title}</h3>
                  <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-dark-800">
                  <span className="text-xs font-semibold text-primary-400/90 tracking-wide uppercase">
                    {f.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
            Flujo Simple
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mt-2 tracking-tight">
            Cómo funciona BarberGo
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((st, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl bg-dark-900/70 border border-dark-800/80"
            >
              <span className="text-4xl font-display font-black text-dark-700 block mb-3">
                {st.num}
              </span>
              <h3 className="text-lg font-bold text-white mb-2">{st.title}</h3>
              <p className="text-sm text-dark-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
