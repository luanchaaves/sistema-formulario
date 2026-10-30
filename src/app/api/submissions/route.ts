import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const query = searchParams.get("q")?.toLowerCase();

    const where: any = {};
    if (formId && formId !== "all") {
      where.formId = formId;
    }

    const submissions = await db.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
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
      take: 200,
    });

    let filtered = submissions;
    if (query) {
      filtered = submissions.filter((sub) => {
        const matchesForm = sub.form.title.toLowerCase().includes(query);
        const answersStr = JSON.stringify(sub.answers).toLowerCase();
        const respInfo = JSON.stringify(sub.respondentInfo || {}).toLowerCase();
        return matchesForm || answersStr.includes(query) || respInfo.includes(query);
      });
    }

    return NextResponse.json({ submissions: filtered });
  } catch (err: any) {
    console.error("Erro ao listar respostas:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
