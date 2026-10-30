import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { Role, Prisma } from "@prisma/client";

const updateFormSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  slug: z.string().min(2).optional(),
  schema: z.record(z.string(), z.any()).optional(),
  designSettings: z.record(z.string(), z.any()).optional(),
  createNewVersion: z.boolean().optional(),
});

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
        owner: { select: { id: true, name: true, email: true } },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const currentVersion = form.versions[0] || null;

    return NextResponse.json({ form, currentVersion });
  } catch (error) {
    console.error("Get form error:", error);
    return NextResponse.json({ error: "Erro ao carregar formulário" }, { status: 500 });
  }
}

export async function PATCH(
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
        { error: "Permissão insuficiente para editar formulários." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parse = updateFormSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const form = await db.form.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    const { title, description, slug, schema, designSettings, createNewVersion } = parse.data;

    // Check slug uniqueness if changed
    if (slug && slug !== form.slug) {
      const existing = await db.form.findUnique({ where: { slug } });
      if (existing) {
        return NextResponse.json(
          { error: "Este link permanente (slug) já está em uso por outro formulário." },
          { status: 400 }
        );
      }
    }

    let currentVersion = form.versions[0];

    // Handle Versioning: if createNewVersion requested or if published with submissions
    if (createNewVersion && (schema || designSettings)) {
      const nextVersionNum = (currentVersion?.version || 1) + 1;
      currentVersion = await db.formVersion.create({
        data: {
          formId: form.id,
          version: nextVersionNum,
          schema: (schema || currentVersion.schema) as unknown as Prisma.InputJsonValue,
          designSettings: (designSettings || currentVersion.designSettings) as unknown as Prisma.InputJsonValue,
        },
      });
    } else if (currentVersion && (schema || designSettings)) {
      currentVersion = await db.formVersion.update({
        where: { id: currentVersion.id },
        data: {
          schema: (schema || currentVersion.schema) as unknown as Prisma.InputJsonValue,
          designSettings: (designSettings || currentVersion.designSettings) as unknown as Prisma.InputJsonValue,
        },
      });
    }

    const updated = await db.form.update({
      where: { id },
      data: {
        title: title || form.title,
        description: description !== undefined ? description : form.description,
        slug: slug || form.slug,
        currentVersionId: currentVersion?.id || form.currentVersionId,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "FORM_UPDATE",
      entityType: "Form",
      entityId: form.id,
      formId: form.id,
      metadata: { title, slug, version: currentVersion?.version },
    });

    return NextResponse.json({ success: true, form: updated, currentVersion });
  } catch (error) {
    console.error("Update form error:", error);
    return NextResponse.json({ error: "Erro ao salvar formulário" }, { status: 500 });
  }
}

export async function DELETE(
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
        { error: "Permissão insuficiente para excluir formulários." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const form = await db.form.findUnique({ where: { id } });
    if (!form) {
      return NextResponse.json({ error: "Formulário não encontrado" }, { status: 404 });
    }

    await db.form.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      action: "FORM_DELETE",
      entityType: "Form",
      entityId: id,
      metadata: { title: form.title, slug: form.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete form error:", error);
    return NextResponse.json({ error: "Erro ao excluir formulário" }, { status: 500 });
  }
}
