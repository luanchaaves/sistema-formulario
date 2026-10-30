import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/shell";
import { ResponsesClient } from "@/components/responses/responses-client";
import { FormField } from "@/lib/types/form";

export const metadata = {
  title: "Respostas | FormFlow",
};

export default async function ResponsesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all forms for dropdown filter
  const forms = await db.form.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });

  // Fetch recent submissions
  const rawSubmissions = await db.submission.findMany({
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

  const submissions = rawSubmissions.map((sub) => {
    const schema = sub.formVersion.schema as any;
    const fields: FormField[] = schema?.pages ? schema.pages.flatMap((p: any) => p.fields || []) : [];
    const respInfo = (sub.respondentInfo as any) || {};

    return {
      id: sub.id,
      formId: sub.formId,
      createdAt: sub.submittedAt.toISOString(),
      respondentId: respInfo.identifier || respInfo.ipHash || null,
      answers: (sub.answers as Record<string, any>) || {},
      ipAddress: respInfo.ipHash ? `IP #${respInfo.ipHash}` : null,
      userAgent: respInfo.userAgent || null,
      form: sub.form,
      formVersion: {
        version: sub.formVersion.version,
        fields,
      },
    };
  });

  return (
    <DashboardShell user={user} breadcrumbs={[{ label: "Respostas", href: "/dashboard/responses" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Gerenciador de Respostas</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Consulte todas as respostas submetidas aos seus formulários, visualize dados detalhados e exporte para CSV.
          </p>
        </div>

        <ResponsesClient
          initialSubmissions={submissions}
          forms={forms}
          userRole={user.role}
        />
      </div>
    </DashboardShell>
  );
}
