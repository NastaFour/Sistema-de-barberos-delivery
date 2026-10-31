import prisma from "../../src/config/db";
import {
  getUserProfile,
  loginUser,
  refreshTokens,
  registerUser,
} from "../../src/services/auth.service";
import * as jwt from "../../src/utils/jwt";
import { comparePassword, hashPassword } from "../../src/utils/password";

jest.mock("../../src/config/db", () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  barberProfile: { create: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock("../../src/utils/password", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../../src/utils/jwt", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    const input = {
      email: "test@example.com",
      password: "secure123",
      name: "Test User",
      role: "CLIENT" as const,
    };

    it("retorna usuario con tokens si el registro es exitoso", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue("hashed_abc");
      (jwt.generateAccessToken as jest.Mock).mockReturnValue("access-x");
      (jwt.generateRefreshToken as jest.Mock).mockReturnValue("refresh-x");

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            user: {
              create: jest
                .fn()
                .mockResolvedValue({
                  id: "u1",
                  email: "test@example.com",
                  name: "Test User",
                  role: "CLIENT",
                  phone: null,
                  avatar: null,
                  createdAt: new Date(),
                }),
            },
            barberProfile: { create: jest.fn() },
          };
          return fn(tx);
        },
      );

      const result = await registerUser(input);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe("access-x");
      expect(result.refreshToken).toBe("refresh-x");
    });

    it("lanza error si el email ya existe", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

      await expect(registerUser(input)).rejects.toThrow("User with this email already exists");
    });

    it("crea barberProfile si el rol es BARBER", async () => {
      const txUserCreate = jest
        .fn()
        .mockResolvedValue({
          id: "u1",
          email: "b@b.com",
          name: "Barber",
          role: "BARBER",
          phone: null,
          avatar: null,
          createdAt: new Date(),
        });
      const txBarberCreate = jest.fn();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue("hashed");
      (jwt.generateAccessToken as jest.Mock).mockReturnValue("a");
      (jwt.generateRefreshToken as jest.Mock).mockReturnValue("r");
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          return fn({ user: { create: txUserCreate }, barberProfile: { create: txBarberCreate } });
        },
      );

      await registerUser({ ...input, role: "BARBER" });

      expect(txBarberCreate).toHaveBeenCalledWith({
        data: { userId: "u1" },
      });
    });
  });

  describe("loginUser", () => {
    const input = { email: "test@example.com", password: "secure123" };

    it("retorna usuario sin password y tokens", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "test@example.com",
        password: "hashed",
        name: "T",
        role: "CLIENT",
      });
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (jwt.generateAccessToken as jest.Mock).mockReturnValue("a");
      (jwt.generateRefreshToken as jest.Mock).mockReturnValue("r");

      const result = await loginUser(input);

      expect(result.accessToken).toBe("a");
      expect(result.refreshToken).toBe("r");
      expect(result.user).not.toHaveProperty("password");
    });

    it("lanza error con credenciales invalidas", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loginUser(input)).rejects.toThrow("Invalid credentials");
    });

    it("lanza error si password no coincide", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "test@example.com",
        password: "hashed",
      });
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(loginUser(input)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshTokens", () => {
    it("retorna nuevo accessToken", async () => {
      (jwt.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: "u1",
        email: "e@e.com",
        role: "CLIENT",
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "e@e.com",
        role: "CLIENT",
      });
      (jwt.generateAccessToken as jest.Mock).mockReturnValue("new-access");

      const result = await refreshTokens("valid-refresh");

      expect(result.accessToken).toBe("new-access");
      expect(result.refreshToken).toBe("valid-refresh");
    });

    it("lanza error si el token es invalido", async () => {
      (jwt.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(refreshTokens("bad")).rejects.toThrow("Invalid refresh token");
    });

    it("lanza error si el usuario ya no existe", async () => {
      (jwt.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: "gone",
        email: "x",
        role: "CLIENT",
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokens("orphan")).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("getUserProfile", () => {
    it("retorna perfil del usuario", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        email: "e@e.com",
        name: "User",
        role: "CLIENT",
      });

      const user = await getUserProfile("u1");
      expect(user).toBeDefined();
      expect(user.id).toBe("u1");
    });

    it("lanza error si no se encuentra el usuario", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserProfile("nonexistent")).rejects.toThrow("User not found");
    });
  });
});
