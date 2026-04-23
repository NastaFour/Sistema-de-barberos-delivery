import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Clock, Users, DollarSign, Star, MapPin, CheckCircle, XCircle, PlayCircle, Scissors, Image as ImageIcon, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos mockeados - reemplazar con llamadas API reales
const mockBookings = [
  { id: '1', client: 'Carlos Pérez', service: 'Corte + Barba', date: new Date(), status: 'PENDING', address: 'Av. Principal 123' },
  { id: '2', client: 'Luis Rodríguez', service: 'Corte Clásico', date: new Date(Date.now() + 86400000), status: 'CONFIRMED', address: 'Calle 5 #45' },
  { id: '3', client: 'Miguel Ángel', service: 'Afeitado Premium', date: new Date(Date.now() + 172800000), status: 'COMPLETED', address: 'Plaza Central' },
];

const mockServices = [
  { id: '1', name: 'Corte Clásico', price: 15, duration: 30, active: true },
  { id: '2', name: 'Corte + Barba', price: 25, duration: 45, active: true },
  { id: '3', name: 'Afeitado Premium', price: 20, duration: 30, active: true },
  { id: '4', name: 'Coloración', price: 40, duration: 90, active: false },
];

const mockStats = {
  totalBookings: 45,
  monthlyRevenue: 1250,
  avgRating: 4.8,
  newClients: 12,
};

export default function BarberDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('agenda');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    console.log(`Actualizando booking ${bookingId} a ${newStatus}`);
    // Aquí iría la llamada API real
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'default'> = {
      PENDING: 'secondary',
      CONFIRMED: 'default',
      IN_PROGRESS: 'outline',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
    };
    const icons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="w-3 h-3 mr-1" />,
      CONFIRMED: <CheckCircle className="w-3 h-3 mr-1" />,
      IN_PROGRESS: <PlayCircle className="w-3 h-3 mr-1" />,
      COMPLETED: <CheckCircle className="w-3 h-3 mr-1" />,
      CANCELLED: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const renderAgenda = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Agenda de Citas</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Día
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {mockBookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{booking.client.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{booking.client}</p>
                      <p className="text-sm text-muted-foreground">{booking.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(booking.date, 'dd MMM yyyy', { locale: es })}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {format(booking.date, 'HH:mm', { locale: es })}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {booking.address}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(booking.status)}
                  <div className="flex gap-2">
                    {booking.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(booking.id, 'IN_PROGRESS')}
                      >
                        Iniciar
                      </Button>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                      >
                        Completar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mis Servicios</h3>
        <Button>Agregar Servicio</Button>
      </div>

      <div className="grid gap-4">
        {mockServices.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{service.name}</p>
                    {!service.active && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {service.duration} min - ${service.price}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Editar</Button>
                  <Button size="sm" variant={service.active ? 'destructive' : 'default'}>
                    {service.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mi Galería</h3>
        <Button>Subir Imágenes</Button>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-4">
            Arrastra y suelta imágenes para reordenar
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas este mes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.monthlyRevenue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rating promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.avgRating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes nuevos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{mockStats.newClients}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mr-2" />
            Gráfico de reservas por día (implementar con recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Scissors className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">BarberGo Dashboard</h1>
              <p className="text-sm text-muted-foreground">Panel de control para barberos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Avatar>
              <AvatarFallback>{user?.name?.charAt(0) || 'B'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Galería</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agenda">{renderAgenda()}</TabsContent>
          <TabsContent value="services">{renderServices()}</TabsContent>
          <TabsContent value="gallery">{renderGallery()}</TabsContent>
          <TabsContent value="stats">{renderStats()}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
