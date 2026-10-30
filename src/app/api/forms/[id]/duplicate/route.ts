import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hasPermission } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { Role, FormStatus, Prisma } from "@prisma/client";

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
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
    }

    const { id } = await params;

    const source = await db.form.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Formulário de origem não encontrado" }, { status: 404 });
    }

    const newTitle = `${source.title} (Cópia)`;
    let baseSlug = `${source.slug}-copia`;
    let slug = baseSlug;
    let count = 1;

    while (await db.form.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}-${count++}`;
    }

    const newForm = await db.form.create({
      data: {
        title: newTitle,
        description: source.description,
        slug,
        status: FormStatus.DRAFT,
        ownerId: user.id,
      },
    });

    const sourceVersion = source.versions[0];
    const newVersion = await db.formVersion.create({
      data: {
        formId: newForm.id,
        version: 1,
        schema: (sourceVersion ? sourceVersion.schema : { pages: [] }) as unknown as Prisma.InputJsonValue,
        designSettings: (sourceVersion ? sourceVersion.designSettings : {}) as unknown as Prisma.InputJsonValue,
      },
    });

    const updated = await db.form.update({
      where: { id: newForm.id },
      data: { currentVersionId: newVersion.id },
    });

    await createAuditLog({
      userId: user.id,
      action: "FORM_DUPLICATE",
      entityType: "Form",
      entityId: newForm.id,
      formId: newForm.id,
      metadata: { originalFormId: id, newSlug: slug },
    });

    return NextResponse.json({ success: true, form: updated });
  } catch (error) {
    console.error("Duplicate form error:", error);
    return NextResponse.json({ error: "Erro ao duplicar formulário" }, { status: 500 });
  }
}
