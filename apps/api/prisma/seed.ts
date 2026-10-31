import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hash = await bcrypt.hash("Demo1234", 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@barbergo.com" },
    update: {},
    create: {
      email: "admin@barbergo.com",
      password: hash,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`Admin: ${admin.email}`);

  // Cliente demo
  const client = await prisma.user.upsert({
    where: { email: "cliente@barbergo.com" },
    update: {},
    create: {
      email: "cliente@barbergo.com",
      password: hash,
      name: "Carlos Cliente",
      phone: "+584141234567",
      role: "CLIENT",
    },
  });
  console.log(`Cliente: ${client.email}`);

  // Barbero 1 – Caracas
  const barber1User = await prisma.user.upsert({
    where: { email: "jose@barbergo.com" },
    update: {},
    create: {
      email: "jose@barbergo.com",
      password: hash,
      name: "José Martínez",
      phone: "+584241234567",
      role: "BARBER",
    },
  });

  const barber1 = await prisma.barberProfile.upsert({
    where: { userId: barber1User.id },
    update: {},
    create: {
      userId: barber1User.id,
      bio: "Barbero profesional con 8 años de experiencia. Especialista en degradados y barbas.",
      specialty: ["Degradado", "Barba", "Corte Clásico"],
      yearsExperience: 8,
      isVerified: true,
      isActive: true,
      rating: 4.8,
      totalReviews: 42,
      latitude: 10.4806,
      longitude: -66.9036,
      serviceRadius: 15,
      availability: {
        monday: { start: "08:00", end: "18:00" },
        tuesday: { start: "08:00", end: "18:00" },
        wednesday: { start: "08:00", end: "18:00" },
        thursday: { start: "08:00", end: "18:00" },
        friday: { start: "08:00", end: "18:00" },
        saturday: { start: "09:00", end: "15:00" },
      },
    },
  });

  await prisma.barberService.createMany({
    data: [
      {
        barberId: barber1.id,
        name: "Degradado Classic",
        description: "Degradado completo con tijera",
        price: 15,
        duration: 45,
      },
      {
        barberId: barber1.id,
        name: "Corte + Barba",
        description: "Corte de cabello y perfilado de barba",
        price: 20,
        duration: 60,
      },
      {
        barberId: barber1.id,
        name: "Barba Premium",
        description: "Arreglo de barba con toalla caliente",
        price: 10,
        duration: 30,
      },
      {
        barberId: barber1.id,
        name: "Corte Infantil",
        description: "Corte para niños hasta 12 años",
        price: 10,
        duration: 30,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`Barbero 1: ${barber1User.email} (${barber1.id})`);

  // Barbero 2 – Caracas
  const barber2User = await prisma.user.upsert({
    where: { email: "maria@barbergo.com" },
    update: {},
    create: {
      email: "maria@barbergo.com",
      password: hash,
      name: "María Rodríguez",
      phone: "+584241234568",
      role: "BARBER",
    },
  });

  const barber2 = await prisma.barberProfile.upsert({
    where: { userId: barber2User.id },
    update: {},
    create: {
      userId: barber2User.id,
      bio: "Estilista profesional. Colorimetría, alisados y cortes modernos.",
      specialty: ["Tinte", "Alisado", "Corte Dama"],
      yearsExperience: 5,
      isVerified: true,
      isActive: true,
      rating: 4.5,
      totalReviews: 28,
      latitude: 10.49,
      longitude: -66.91,
      serviceRadius: 10,
      availability: {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "17:00" },
      },
    },
  });

  await prisma.barberService.createMany({
    data: [
      {
        barberId: barber2.id,
        name: "Corte Dama",
        description: "Corte personalizado para dama",
        price: 20,
        duration: 50,
      },
      {
        barberId: barber2.id,
        name: "Tinte Completo",
        description: "Aplicación de tinte + lavado",
        price: 35,
        duration: 90,
      },
      {
        barberId: barber2.id,
        name: "Alisado",
        description: "Alisado brasileño profesional",
        price: 50,
        duration: 120,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`Barbero 2: ${barber2User.email} (${barber2.id})`);

  console.log("\n✅ Seed completado!");
  console.log("Credenciales demo (todas tienen password: Demo1234):");
  console.log("  admin@barbergo.com   (ADMIN)");
  console.log("  cliente@barbergo.com (CLIENT)");
  console.log("  jose@barbergo.com    (BARBER - Caracas)");
  console.log("  maria@barbergo.com   (BARBER - Caracas)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
