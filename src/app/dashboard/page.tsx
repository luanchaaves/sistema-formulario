import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import {
  FileText,
  CheckCircle2,
  Clock,
  Inbox,
  ArrowUpRight,
  Plus,
  ChevronRight,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Real Database Queries
  const [
    totalForms,
    publishedForms,
    draftForms,
    totalSubmissions,
    recentSubmissions,
    formsWithSubmissions,
  ] = await Promise.all([
    db.form.count(),
    db.form.count({ where: { status: "PUBLISHED" } }),
    db.form.count({ where: { status: "DRAFT" } }),
    db.submission.count(),
    db.submission.findMany({
      take: 6,
      orderBy: { submittedAt: "desc" },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    }),
    db.form.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: {
        submissions: {
          _count: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const submissionsLast7Days = await db.submission.count({
    where: {
      submittedAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // Calculate daily data for 7, 30, and 90 days
  const getDailyPoints = async (days: number) => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const subs = await db.submission.findMany({
      where: {
        submittedAt: { gte: since },
      },
      select: { submittedAt: true },
    });

    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(key, 0);
    }

    subs.forEach((s) => {
      const key = s.submittedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + 1);
      }
    });

    return Array.from(map.entries()).map(([date, responses]) => ({
      date,
      responses,
    }));
  };

  const [daily7, daily30, daily90] = await Promise.all([
    getDailyPoints(7),
    getDailyPoints(30),
    getDailyPoints(90),
  ]);

  const topFormsData = formsWithSubmissions
    .filter((f) => f._count.submissions > 0)
    .map((f) => ({
      title: f.title.length > 15 ? f.title.substring(0, 15) + "..." : f.title,
      count: f._count.submissions,
    }));

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-violet-900/20 to-zinc-900 border border-indigo-500/20 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-2">
            <span>Visão Geral do Sistema</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Olá, {user.name}!
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Acompanhe o desempenho de conversão, os formulários ativos e as respostas recebidas em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link
            href="/dashboard/forms/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Formulário</span>
          </Link>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Forms */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total de Formulários
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {totalForms}
            </span>
            <span className="text-xs text-zinc-400">cadastrados</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="text-emerald-500 font-medium">{publishedForms} publicados</span>
            <span>&bull;</span>
            <span>{draftForms} rascunhos</span>
          </div>
        </div>

        {/* Published Forms */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Formulários Publicados
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {publishedForms}
            </span>
            <span className="text-xs text-emerald-500 font-medium">No ar</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Recebendo respostas ativamente
          </p>
        </div>

        {/* Total Submissions */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:border-violet-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total de Respostas
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {totalSubmissions}
            </span>
            <span className="text-xs text-zinc-400">acumuladas</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Armazenadas no PostgreSQL
          </p>
        </div>

        {/* Last 7 Days Submissions */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Últimos 7 Dias
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {submissionsLast7Days}
            </span>
            <span className="text-xs text-indigo-500 font-medium">Recentes</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Respostas recebidas nesta semana
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <OverviewCharts
        dailyData7={daily7}
        dailyData30={daily30}
        dailyData90={daily90}
        topForms={topFormsData}
      />

      {/* Recent Submissions List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
              Respostas Recentes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Últimos envios registrados nos seus formulários
            </p>
          </div>

          <Link
            href="/dashboard/responses"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Ver todas as respostas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            <Inbox className="w-10 h-10 stroke-1 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Nenhuma resposta registrada ainda</p>
            <p className="text-xs text-zinc-400 mt-1">
              Publique um formulário e compartilhe o link para começar a receber dados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3 font-semibold">Formulário</th>
                  <th className="pb-3 font-semibold">Respondente / Dados</th>
                  <th className="pb-3 font-semibold">Data e Horário</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {recentSubmissions.map((sub) => {
                  const answersObj = (sub.answers as Record<string, unknown>) || {};
                  // Find identifying field if any (name or email)
                  const identifier =
                    String(
                      answersObj["f_nome"] ||
                        answersObj["nome"] ||
                        answersObj["name"] ||
                        answersObj["f_email"] ||
                        answersObj["email"] ||
                        "Respondente Anônimo"
                    );

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 font-medium text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                        {sub.form.title}
                      </td>
                      <td className="py-3.5 text-zinc-600 dark:text-zinc-300 max-w-[200px] truncate">
                        {identifier}
                      </td>
                      <td className="py-3.5 text-zinc-500 dark:text-zinc-400">
                        {sub.submittedAt.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/dashboard/responses?formId=${sub.formId}&submissionId=${sub.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalhes</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
