import { useQuery } from "@tanstack/react-query";
import { Check, Clock, MapPin, Navigation, Star } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { MapView } from "../components/MapView";
import { barberAPI } from "../lib/api";

export default function BarberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"services" | "gallery" | "reviews">("services");
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["barber", id],
    queryFn: () => barberAPI.getById(id!),
    enabled: !!id,
  });

  const b = data?.data;

  const name = b?.user?.name || b?.name || "Barbero";
  const avatar = b?.user?.avatar || b?.avatar;
  const rating = b?.rating ?? 0;
  const totalReviews = b?.totalReviews ?? 0;
  const exp = b?.yearsExperience ?? b?.experience ?? 0;
  const specialties: string[] = b?.specialty || b?.specialties || [];
  const gallery: { id: string; imageUrl: string; caption?: string }[] = b?.gallery || [];
  const reviews: { id: string; rating: number; comment?: string; client?: { name: string } }[] =
    b?.reviews || [];
  const services: {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
  }[] = b?.services || [];

  const total = selected.reduce((sum, sid) => {
    const svc = services.find((s) => s.id === sid);
    return sum + (svc?.price || 0);
  }, 0);

  const toggle = (sid: string) =>
    setSelected((p) => (p.includes(sid) ? p.filter((s) => s !== sid) : [...p, sid]));

  const handleBook = () => {
    if (selected.length === 0) {
      toast.error("Selecciona al menos un servicio");
      return;
    }
    navigate(`/book?barberId=${id}&services=${selected.join(",")}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !b) {
    return (
      <div className="min-h-screen bg-dark-950 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-dark-300">Barbero no encontrado</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary-400 text-sm hover:text-primary-300"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Cover */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {gallery.length > 0 ? (
          <img src={gallery[0].imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-5xl font-bold text-white">
              {name.charAt(0)}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-dark-400 text-sm mb-2">
              <MapPin className="w-3.5 h-3.5" /> A domicilio
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white">{name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{rating.toFixed(1)}</span>
                <span className="text-dark-300 ml-1 text-sm">({totalReviews} resenas)</span>
              </div>
              <span className="text-dark-500">&middot;</span>
              <span className="text-dark-300 text-sm">{exp} anos exp.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1">
            {/* Bio */}
            {b.bio && (
              <div className="card-flat mb-6 stagger-item">
                <h3 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-3">
                  Sobre el barbero
                </h3>
                <p className="text-dark-200 leading-relaxed">{b.bio}</p>
                {specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {specialties.map((s, i) => (
                      <span key={i} className="badge badge-info">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-dark-800 mb-6">
              {(
                [
                  ["services", "Servicios"],
                  ["gallery", "Galeria"],
                  ["reviews", "Resenas"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors duration-fast ${
                    tab === key
                      ? "text-white bg-dark-900 border border-dark-800 border-b-dark-900"
                      : "text-dark-400 hover:text-dark-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Services */}
            {tab === "services" && (
              <div className="space-y-3">
                {services.map((s, i) => {
                  const sel = selected.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`stagger-item w-full text-left p-5 rounded-2xl border-2 transition-all duration-fast ${
                        sel
                          ? "border-primary-500 bg-primary-500/5"
                          : "border-dark-800 bg-dark-900/30 hover:border-dark-600"
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">{s.name}</h4>
                          {s.description && (
                            <p className="text-dark-400 text-sm mt-1">{s.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-3 text-sm text-dark-400">
                            <Clock className="w-3.5 h-3.5" /> {s.duration} min
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-bold text-white">${s.price}</span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${sel ? "bg-primary-500 border-primary-500" : "border-dark-600"}`}
                          >
                            {sel && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {services.length === 0 && (
                  <p className="text-dark-500 text-center py-12">Sin servicios disponibles</p>
                )}
              </div>
            )}

            {/* Gallery */}
            {tab === "gallery" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.length > 0 ? (
                  gallery.map((img, i) => (
                    <div
                      key={img.id}
                      className="stagger-item aspect-square rounded-xl overflow-hidden bg-dark-800"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.caption || ""}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-slow"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-dark-500 col-span-full text-center py-12">Galeria vacia</p>
                )}
              </div>
            )}

            {/* Reviews */}
            {tab === "reviews" && (
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((r, i) => (
                    <div
                      key={r.id}
                      className="card-flat stagger-item"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                          {r.client?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {r.client?.name || "Anonimo"}
                          </p>
                          <div className="flex text-amber-400">
                            {Array.from({ length: r.rating }, (_, j) => (
                              <Star key={j} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-dark-300 text-sm leading-relaxed">{r.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-dark-500 text-center py-12">Sin resenas todavia</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {b.latitude && b.longitude && (
            <div className="lg:w-80 shrink-0">
              <div className="card-flat sticky top-24">
                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" /> Ubicacion
                </h3>
                <div className="h-40 rounded-xl overflow-hidden border border-dark-700 mb-3">
                  <MapView
                    center={[b.latitude, b.longitude]}
                    zoom={14}
                    markers={[{ id: "barber", lat: b.latitude, lng: b.longitude }]}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Navigation className="w-4 h-4" /> Como llegar
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 glass border-t border-dark-800 p-4 z-sticky animate-slide-up">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-xs">{selected.length} servicio(s)</p>
              <p className="text-2xl font-display font-bold text-white">${total}</p>
            </div>
            <button onClick={handleBook} className="btn-white">
              Reservar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
