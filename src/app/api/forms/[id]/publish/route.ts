import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { Role, FormStatus } from "@prisma/client";

const actionSchema = z.object({
  action: z.enum(["publish", "unpublish", "archive"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!hasPermission(user.role, [Role.ADMIN, Role.EDITOR])) {
      return NextResponse.json(
        { error: "Permissão insuficiente." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parse = actionSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const { action } = parse.data;

    let newStatus: FormStatus = FormStatus.DRAFT;
    let publishedAt: Date | null | undefined = undefined;

    if (action === "publish") {
      newStatus = FormStatus.PUBLISHED;
      publishedAt = new Date();
    } else if (action === "unpublish") {
      newStatus = FormStatus.DRAFT;
    } else if (action === "archive") {
      newStatus = FormStatus.ARCHIVED;
    }

    const updated = await db.form.update({
      where: { id },
      data: {
        status: newStatus,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      },
    });

    await createAuditLog({
      userId: user.id,
      action: `FORM_${action.toUpperCase()}`,
      entityType: "Form",
      entityId: id,
      formId: id,
      metadata: { status: newStatus },
    });

    return NextResponse.json({ success: true, form: updated });
  } catch (error) {
    console.error("Publish action error:", error);
    return NextResponse.json({ error: "Erro ao alterar status do formulário" }, { status: 500 });
  }
}
