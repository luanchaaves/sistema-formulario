import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar usuários" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Safety checks for self-editing
    if (sessionUser.id === id) {
      if (result.data.isActive === false) {
        return NextResponse.json(
          { error: "Você não pode desativar sua própria conta de administrador" },
          { status: 400 }
        );
      }
      if (result.data.role && result.data.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Você não pode remover seu próprio perfil de administrador" },
          { status: 400 }
        );
      }
    }

    const updatePayload: any = {};
    if (result.data.name !== undefined) updatePayload.name = result.data.name;
    if (result.data.role !== undefined) updatePayload.role = result.data.role;
    if (result.data.isActive !== undefined) updatePayload.active = result.data.isActive;

    const updatedUser = await db.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: sessionUser.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      metadata: {
        changes: result.data,
        targetEmail: targetUser.email,
      },
    });

    return NextResponse.json({
      user: {
        ...updatedUser,
        isActive: updatedUser.active,
      },
      message: "Usuário atualizado com sucesso",
    });
  } catch (err: any) {
    console.error("Erro ao atualizar usuário:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir usuários" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (sessionUser.id === id) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Delete user sessions first
    await db.session.deleteMany({
      where: { userId: id },
    });

    // Delete user
    await db.user.delete({
      where: { id },
    });

    await createAuditLog({
      userId: sessionUser.id,
      action: "USER_DELETED",
      entityType: "User",
      entityId: id,
      metadata: {
        deletedEmail: targetUser.email,
        deletedName: targetUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso",
    });
  } catch (err: any) {
    console.error("Erro ao excluir usuário:", err);
    return NextResponse.json({ error: "Erro interno ao excluir usuário" }, { status: 500 });
  }
}
