import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "./password";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "formflow_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory rate limiting tracker for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function invalidateSession(token: string) {
  try {
    await db.session.delete({
      where: { token },
    });
  } catch {
    // Ignore if not found
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  if (!session.user.active) {
    return null;
  }

  return session.user;
}

export const getSessionUser = getCurrentUser;

export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  if (userRole === Role.ADMIN) return true;
  if (userRole === Role.EDITOR && allowedRoles.includes(Role.EDITOR)) return true;
  if (userRole === Role.VIEWER && allowedRoles.includes(Role.VIEWER)) return true;
  return false;
}

/**
 * Bootstraps the first administrator if database has no active users
 */
export async function ensureInitialAdmin() {
  try {
    const userCount = await db.user.count();
    if (userCount > 0) {
      return;
    }

    const email = process.env.ADMIN_EMAIL || "admin@formflow.local";
    const password = process.env.ADMIN_PASSWORD || "FormFlow@2026!Admin";
    const name = process.env.ADMIN_NAME || "Administrador FormFlow";

    const passwordHash = await hashPassword(password);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ADMIN,
        active: true,
      },
    });

    console.log(`[FormFlow] Initial Administrator created with email: ${email}`);
  } catch (error) {
    console.error("[FormFlow] Failed to ensure initial admin:", error);
  }
}
