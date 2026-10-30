import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { defaultDesignSettings } from "@/lib/types/form";
import { Role, FormStatus, Prisma } from "@prisma/client";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

const createFormSchema = z.object({
  title: z.string().min(2, "O título deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as FormStatus | null;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const forms = await db.form.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("List forms error:", error);
    return NextResponse.json({ error: "Erro ao listar formulários" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!hasPermission(user.role, [Role.ADMIN, Role.EDITOR])) {
      return NextResponse.json(
        { error: "Permissão insuficiente. Visualizadores não podem criar formulários." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parse = createFormSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { title, description } = parse.data;
    let baseSlug = slugify(title) || "formulario";
    let slug = baseSlug;
    let count = 1;

    // Ensure unique slug
    while (await db.form.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}-${count++}`;
    }

    const initialSchema = {
      pages: [
        {
          id: "page-1",
          title: "Início",
          description: description || "Preencha as informações solicitadas.",
          fields: [
            {
              id: "f_nome_" + Date.now(),
              type: "text",
              label: "Seu Nome Completo",
              placeholder: "Ex: João da Silva",
              required: true,
            },
            {
              id: "f_email_" + Date.now(),
              type: "email",
              label: "Seu E-mail",
              placeholder: "exemplo@email.com",
              required: true,
            },
          ],
        },
      ],
    };

    const form = await db.form.create({
      data: {
        title,
        description: description || null,
        slug,
        status: FormStatus.DRAFT,
        ownerId: user.id,
      },
    });

    const version = await db.formVersion.create({
      data: {
        formId: form.id,
        version: 1,
        schema: initialSchema as unknown as Prisma.InputJsonValue,
        designSettings: defaultDesignSettings as unknown as Prisma.InputJsonValue,
      },
    });

    const updatedForm = await db.form.update({
      where: { id: form.id },
      data: { currentVersionId: version.id },
    });

    await createAuditLog({
      userId: user.id,
      action: "FORM_CREATE",
      entityType: "Form",
      entityId: form.id,
      formId: form.id,
      metadata: { title, slug },
    });

    return NextResponse.json({ success: true, form: updatedForm }, { status: 201 });
  } catch (error) {
    console.error("Create form error:", error);
    return NextResponse.json({ error: "Erro ao criar formulário" }, { status: 500 });
  }
}
