import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';

export default function HomePage() {
  return (
    <DashboardLayout>
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-dark-950"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 animate-fade-in">
            Barberos a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Domicilio</span>
          </h1>
          <p className="text-xl text-dark-300 mb-8 max-w-3xl mx-auto animate-slide-up">
            Reserva tu barbero favorito y recibe un corte profesional en la comodidad de tu hogar. 
            Sin esperas, sin tráfico, solo estilo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/barbers" className="btn-primary text-lg px-8 py-4">
              Encontrar Barbero
            </Link>
            <Link to="/register" className="btn-outline text-lg px-8 py-4">
              Ser Barbero
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-16">
            ¿Por qué elegir <span className="text-primary-500">BarberGo</span>?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Ahorra Tiempo',
                description: 'Sin desplazamientos ni esperas. Tu barbero va directamente a tu ubicación.'
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Profesionales Verificados',
                description: 'Todos nuestros barberos están verificados y cuentan con excelentes valoraciones.'
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Precios Transparentes',
                description: 'Conoce el precio final antes de reservar. Sin sorpresas ni cargos ocultos.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="card hover:border-primary-500/50 transition-all duration-300 group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-primary-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-16">
            ¿Cómo funciona?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Elige tu Barbero', desc: 'Explora perfiles, especialidades y valoraciones' },
              { step: '02', title: 'Selecciona Servicio', desc: 'Corte, barba, o combo completo' },
              { step: '03', title: 'Reserva Hora', desc: 'Elige fecha y hora que mejor te convenga' },
              { step: '04', title: 'Disfruta', desc: 'Tu barbero llega a tu puerta y hace su magia' }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="text-6xl font-display font-bold text-primary-500/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400">{item.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center card bg-gradient-to-br from-primary-900/50 to-dark-900 border-primary-500/30">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="text-dark-300 mb-8">
            Únete a miles de clientes satisfechos y experimenta la revolución del cuidado personal a domicilio.
          </p>
          <Link to="/barbers" className="btn-primary text-lg px-8 py-4 inline-block">
            Reservar Ahora
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
