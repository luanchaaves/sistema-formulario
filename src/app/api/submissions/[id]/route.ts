import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const submission = await db.submission.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        formVersion: {
          select: {
            version: true,
            schema: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (err: any) {
    console.error("Erro ao buscar resposta:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (user.role === "VIEWER") {
      return NextResponse.json(
        { error: "Apenas administradores e editores podem excluir respostas" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const submission = await db.submission.findUnique({
      where: { id },
      include: { form: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 });
    }

    await db.submission.delete({
      where: { id },
    });

    await createAuditLog({
      userId: user.id,
      action: "SUBMISSION_DELETED",
      entityType: "Submission",
      entityId: id,
      formId: submission.formId,
      metadata: {
        formTitle: submission.form.title,
      },
    });

    return NextResponse.json({ success: true, message: "Resposta excluída com sucesso" });
  } catch (err: any) {
    console.error("Erro ao excluir resposta:", err);
    return NextResponse.json({ error: "Erro interno ao excluir resposta" }, { status: 500 });
  }
}
