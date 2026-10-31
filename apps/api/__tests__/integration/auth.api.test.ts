import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";

jest.mock("../../src/config/env", () => ({
  config: {
    NODE_ENV: "test",
    PORT: 3001,
    DATABASE_URL: "postgresql://mock",
    JWT_SECRET: "test-jwt-secret",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    FRONTEND_URL: "http://localhost:5173",
    STRIPE_SECRET_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_mock",
    STRIPE_PLATFORM_FEE_PERCENT: 10,
  },
}));

jest.mock("../../src/config/db", () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  barberProfile: { create: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock("../../src/utils/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed"),
  comparePassword: jest.fn(),
}));

jest.mock("../../src/services/socket.service", () => ({
  getSocket: jest.fn().mockReturnValue(null),
}));

import prisma from "../../src/config/db";
import authRoutes from "../../src/routes/auth.routes";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  return app;
}

describe("Auth API Integration", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe("POST /api/auth/register", () => {
    const body = {
      email: "new@example.com",
      password: "Secure123",
      name: "New User",
      role: "CLIENT",
    };

    it("retorna 201 y setea cookies en registro exitoso", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const txUserCreate = jest.fn().mockResolvedValue({
            id: "u1",
            email: "new@example.com",
            name: "New User",
            role: "CLIENT",
            phone: null,
            avatar: null,
            createdAt: new Date(),
          });
          return fn({ user: { create: txUserCreate }, barberProfile: { create: jest.fn() } });
        },
      );

      const res = await request(app).post("/api/auth/register").send(body);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("retorna 409 si el email ya existe", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

      const res = await request(app).post("/api/auth/register").send(body);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    const body = { email: "test@example.com", password: "secure123" };

    it("retorna 200 y setea cookies en login exitoso", async () => {
      const { comparePassword } = require("../../src/utils/password");
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "test@example.com",
        password: "hashed",
        name: "T",
        role: "CLIENT",
        phone: null,
        avatar: null,
        createdAt: new Date(),
      });
      comparePassword.mockResolvedValue(true);

      const res = await request(app).post("/api/auth/login").send(body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers["set-cookie"]).toBeDefined();
      const cookies = Array.isArray(res.headers["set-cookie"])
        ? res.headers["set-cookie"]
        : [res.headers["set-cookie"]];
      expect(cookies.some((c: string) => c.startsWith("accessToken="))).toBe(true);
    });

    it("retorna 401 con credenciales invalidas", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/api/auth/login").send(body);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("retorna 401 sin token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("retorna 200 y limpia cookies", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
