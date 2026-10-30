import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkRateLimit,
  createSession,
  resetRateLimit,
  ensureInitialAdmin,
} from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(1, "A senha é obrigatória"),
});

export async function POST(req: NextRequest) {
  try {
    // Make sure initial admin exists if database is new
    await ensureInitialAdmin();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const body = await req.json().catch(() => ({}));
    const parse = loginSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { email, password } = parse.data;
    const rateLimitKey = `login_${ip}_${email}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Tente novamente em ${rateLimit.retryAfterSeconds} segundos.`,
        },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    // Constant-time check mitigation
    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário desativado" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário desativado" },
        { status: 401 }
      );
    }

    // Reset rate limiter on success
    resetRateLimit(rateLimitKey);

    // Create session cookie
    await createSession(user.id);

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { ip, userAgent: req.headers.get("user-agent") },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar autenticação" },
      { status: 500 }
    );
  }
}
