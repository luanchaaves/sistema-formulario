import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { BuilderClient } from "@/components/builder/builder-client";

export const dynamic = "force-dynamic";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;

  const form = await db.form.findUnique({
    where: { id },
    include: {
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
    notFound();
  }

  const currentVersion = form.versions[0] || null;

  return (
    <BuilderClient
      initialForm={{
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        status: form.status,
        _count: form._count,
      }}
      initialVersion={
        currentVersion
          ? {
              id: currentVersion.id,
              version: currentVersion.version,
              schema: currentVersion.schema,
              designSettings: currentVersion.designSettings,
            }
          : null
      }
      userRole={user.role}
    />
  );
}
