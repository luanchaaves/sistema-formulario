import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = result.data;
    const updateData: any = {};

    if (name) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Informe a senha atual para definir uma nova senha" },
          { status: 400 }
        );
      }

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      }

      const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "A senha atual informada está incorreta" },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Nenhuma alteração enviada" });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "PROFILE_UPDATED",
      entityType: "User",
      entityId: user.id,
      metadata: {
        updatedName: !!name,
        updatedPassword: !!newPassword,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "Perfil atualizado com sucesso",
    });
  } catch (err: any) {
    console.error("Erro ao atualizar perfil:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
