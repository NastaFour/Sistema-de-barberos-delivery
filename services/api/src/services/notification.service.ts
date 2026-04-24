import prisma from '../config/db';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Servicio de Notificaciones Push (MVP)
 * Preparado para integrar con Expo Push Notifications o Firebase Cloud Messaging (FCM).
 */
export class NotificationService {
  /**
   * Envía una notificación push a un usuario específico
   */
  static async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      // 1. Obtener el Push Token del usuario desde la base de datos
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true /*, pushToken: true*/ }, // Nota: Agregar pushToken al schema Prisma en el futuro
      });

      if (!user) {
        console.warn(`No se pudo enviar la notificación. Usuario ${userId} no encontrado.`);
        return false;
      }

      // const token = user.pushToken;
      const token = "mock-push-token-123"; // Simulado para MVP

      if (!token) {
        console.warn(`El usuario ${userId} no tiene un token de notificación push configurado.`);
        return false;
      }

      // 2. Aquí se integraría el SDK de Expo o Firebase
      // Ejemplo Expo:
      // await expo.sendPushNotificationsAsync([{ to: token, sound: 'default', title: payload.title, body: payload.body, data: payload.data }]);
      
      console.log(`\n[PUSH NOTIFICATION ENVIADA]`);
      console.log(`To User ID: ${userId}`);
      console.log(`Title: ${payload.title}`);
      console.log(`Body: ${payload.body}`);
      if (payload.data) {
        console.log(`Data: ${JSON.stringify(payload.data)}`);
      }
      console.log(`--------------------------\n`);

      return true;
    } catch (error) {
      console.error('Error enviando notificación push:', error);
      return false;
    }
  }

  /**
   * Notifica al barbero de una nueva solicitud de reserva
   */
  static async notifyBarberNewBooking(barberUserId: string, clientName: string, scheduledAt: Date, bookingId: string) {
    const formattedDate = new Intl.DateTimeFormat('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(scheduledAt);

    return this.sendPushNotification(barberUserId, {
      title: '¡Nueva Reserva! ✂️',
      body: `${clientName} ha agendado un servicio para el ${formattedDate}. ¡Revisa tu agenda!`,
      data: { type: 'NEW_BOOKING', bookingId }
    });
  }

  /**
   * Notifica al cliente que su reserva ha sido confirmada o modificada
   */
  static async notifyClientBookingStatus(clientUserId: string, status: string, bookingId: string) {
    let title = 'Actualización de tu reserva';
    let body = 'El estado de tu reserva ha cambiado.';

    if (status === 'CONFIRMED') {
      title = 'Reserva Confirmada ✅';
      body = 'Tu barbero ha confirmado la reserva. ¡Nos vemos pronto!';
    } else if (status === 'CANCELLED') {
      title = 'Reserva Cancelada ❌';
      body = 'La reserva ha sido cancelada.';
    } else if (status === 'IN_PROGRESS') {
      title = 'Servicio en Progreso ✂️';
      body = 'Tu barbero ha iniciado el servicio.';
    }

    return this.sendPushNotification(clientUserId, {
      title,
      body,
      data: { type: 'BOOKING_STATUS', status, bookingId }
    });
  }
}
