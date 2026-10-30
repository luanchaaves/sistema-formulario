import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem acessar a gestão de usuários" },
        { status: 403 }
      );
    }

    const rawUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            forms: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = rawUsers.map((u) => ({
      ...u,
      isActive: u.active,
    }));

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Erro ao listar usuários:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar novos usuários" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    // Check existing email
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um usuário cadastrado com este e-mail" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: sessionUser.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: newUser.id,
      metadata: { email: newUser.email, role: newUser.role, name: newUser.name },
    });

    return NextResponse.json({
      user: {
        ...newUser,
        isActive: newUser.active,
      },
      message: "Usuário criado com sucesso",
    }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar usuário:", err);
    return NextResponse.json({ error: "Erro interno ao criar usuário" }, { status: 500 });
  }
}
