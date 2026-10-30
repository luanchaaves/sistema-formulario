import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { generateSubmissionsCsv } from "@/lib/export/csv";
import { FormSchema, FormField } from "@/lib/types/form";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const form = await db.form.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
        submissions: {
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const currentVersion = form.versions[0];
    const schema = (currentVersion?.schema as unknown as FormSchema) || {
      pages: [],
    };
    const fields: FormField[] = schema.pages.flatMap((p) => p.fields);

    const exportData = form.submissions.map((sub) => ({
      id: sub.id,
      submittedAt: sub.submittedAt,
      answers: (sub.answers as Record<string, unknown>) || {},
    }));

    const csvContent = generateSubmissionsCsv(fields, exportData);
    const filename = `respostas-${form.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);
    return NextResponse.json({ error: "Erro ao gerar arquivo CSV" }, { status: 500 });
  }
}
