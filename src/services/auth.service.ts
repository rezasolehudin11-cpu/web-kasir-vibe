import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "kasir";
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterDTO) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await Bun.password.hash(data.password);

    await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "kasir",
    });

    const [newUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    return newUser;
  }

  static async login(data: LoginDTO) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await Bun.password.verify(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Generate token session
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    await db.insert(sessions).values({
      token,
      userId: user.id,
      expiresAt,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      expiresAt,
    };
  }

  static async validateSession(token: string) {
    const now = new Date();
    const result = await db
      .select({
        session: sessions,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0].user;
  }

  static async logout(token: string) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return true;
  }
}
