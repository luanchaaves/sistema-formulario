import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { FormRenderer } from "@/components/public-form/form-renderer";
import {
  FormSchema,
  DesignSettings,
  defaultDesignSettings,
} from "@/lib/types/form";
import { Lock, Archive } from "lucide-react";
import { FormStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const form = await db.form.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

  if (!form) {
    return { title: "Formulário não encontrado — FormFlow" };
  }

  return {
    title: `${form.title} — FormFlow`,
    description: form.description || "Preencha este formulário online com segurança.",
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
    notFound();
  }

  // If Draft: display unreleased notice
  if (form.status === FormStatus.DRAFT) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
        <div className="max-w-md w-full p-8 text-center rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">
            Formulário Indisponível
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            O formulário <strong>&ldquo;{form.title}&rdquo;</strong> encontra-se em modo de rascunho e ainda não foi liberado para receber respostas públicas.
          </p>
          <p className="text-[11px] text-zinc-500">
            Se você é o proprietário, acesse o painel administrativo para publicá-lo.
          </p>
        </div>
      </div>
    );
  }

  // If Archived: display closed notice
  if (form.status === FormStatus.ARCHIVED) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
        <div className="max-w-md w-full p-8 text-center rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center mb-4">
            <Archive className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">
            Formulário Encerrado
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            O período de recebimento de respostas para <strong>&ldquo;{form.title}&rdquo;</strong> foi finalizado.
          </p>
          <p className="text-[11px] text-zinc-500">
            Agradecemos a sua atenção. Novas respostas não estão sendo aceitas.
          </p>
        </div>
      </div>
    );
  }

  const currentVersion = form.versions[0];
  const schema = (currentVersion?.schema as unknown as FormSchema) || {
    pages: [],
  };
  const designSettings =
    (currentVersion?.designSettings as unknown as DesignSettings) ||
    defaultDesignSettings;

  return (
    <FormRenderer
      formId={form.id}
      slug={form.slug}
      title={form.title}
      description={form.description}
      schema={schema}
      designSettings={designSettings}
    />
  );
}
