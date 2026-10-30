import React from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { FormsClient } from "@/components/forms/forms-client";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const forms = await db.form.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Gerenciador de Formulários
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Crie, edite, publique e acompanhe todos os formulários da sua organização.
        </p>
      </div>

      <FormsClient initialForms={forms} userRole={user.role} />
    </div>
  );
}
