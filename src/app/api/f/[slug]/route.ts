import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  FormSchema,
  validateSubmissionAnswers,
} from "@/lib/types/form";
import { checkRateLimit } from "@/lib/auth/session";
import { FormStatus, Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Rate limit: max 30 public submissions per IP per 10 minutes
    const rateLimit = checkRateLimit(`public_sub_${ip}_${slug}`, 30, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Limite de envios excedido. Por favor, aguarde ${rateLimit.retryAfterSeconds} segundos.`,
        },
        { status: 429 }
      );
    }

    const form = await db.form.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    if (form.status === FormStatus.DRAFT) {
      return NextResponse.json(
        { error: "Este formulário ainda não foi publicado e não está aceitando respostas." },
        { status: 403 }
      );
    }

    if (form.status === FormStatus.ARCHIVED) {
      return NextResponse.json(
        { error: "Este formulário foi encerrado e não aceita novos envios." },
        { status: 403 }
      );
    }

    const currentVersion = form.versions[0];
    if (!currentVersion) {
      return NextResponse.json(
        { error: "Estrutura do formulário não encontrada" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawAnswers = body.answers || {};
    const honeypot = body._hp;

    // Honeypot spam trap: if bot filled this hidden field, return success without saving
    if (honeypot && String(honeypot).trim() !== "") {
      return NextResponse.json({ success: true, submissionId: "filtered_spam" });
    }

    // Validate answers against the version schema
    const schema = currentVersion.schema as unknown as FormSchema;
    const validation = validateSubmissionAnswers(schema, rawAnswers);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Alguns campos contêm dados inválidos.",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Save submission associated with this exact version
    const submission = await db.submission.create({
      data: {
        formId: form.id,
        formVersionId: currentVersion.id,
        answers: validation.sanitizedAnswers as unknown as Prisma.InputJsonValue,
        respondentInfo: {
          ipHash: Buffer.from(ip).toString("base64").substring(0, 12),
          userAgent: req.headers.get("user-agent")?.substring(0, 120),
          referer: req.headers.get("referer") || undefined,
        },
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Public submission error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao registrar resposta." },
      { status: 500 }
    );
  }
}
