"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  X,
  Calendar,
  Clock,
  Globe,
  FileSpreadsheet,
  AlertTriangle,
  Inbox,
  CheckCircle2,
  Star,
  Copy,
  ChevronRight,
  User,
  ShieldCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { FormField } from "@/lib/types/form";

interface SubmissionItem {
  id: string;
  formId: string;
  createdAt: string | Date;
  respondentId: string | null;
  answers: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  form: {
    id: string;
    title: string;
    slug: string;
  };
  formVersion: {
    version: number;
    fields: FormField[];
  };
}

interface FormOption {
  id: string;
  title: string;
  slug: string;
  _count?: {
    submissions: number;
  };
}

interface ResponsesClientProps {
  initialSubmissions: SubmissionItem[];
  forms: FormOption[];
  userRole: string;
}

export function ResponsesClient({
  initialSubmissions,
  forms,
  userRole,
}: ResponsesClientProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [selectedFormId, setSelectedFormId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSubmission, setActiveSubmission] = useState<SubmissionItem | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<SubmissionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canDelete = userRole === "ADMIN" || userRole === "EDITOR";

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesForm = selectedFormId === "all" || sub.formId === selectedFormId;
    if (!matchesForm) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const respondent = sub.respondentId?.toLowerCase() || "";
    const formTitle = sub.form.title.toLowerCase();
    const answersText = Object.values(sub.answers)
      .map((val) => (typeof val === "object" ? JSON.stringify(val) : String(val)))
      .join(" ")
      .toLowerCase();

    return respondent.includes(query) || formTitle.includes(query) || answersText.includes(query);
  });

  const handleDelete = async () => {
    if (!submissionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${submissionToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir resposta");

      setSubmissions((prev) => prev.filter((s) => s.id !== submissionToDelete.id));
      if (activeSubmission?.id === submissionToDelete.id) {
        setActiveSubmission(null);
      }
      toast.success("Resposta excluída com sucesso");
      setSubmissionToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir resposta");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    if (selectedFormId === "all") {
      toast.info("Selecione um formulário específico no filtro para exportar o arquivo CSV");
      return;
    }

    setIsExporting(true);
    try {
      window.open(`/api/forms/${selectedFormId}/export/csv`, "_blank");
      toast.success("Iniciando download do arquivo CSV...");
    } catch (err: any) {
      toast.error("Erro ao gerar arquivo CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const copyAnswersJson = (answers: Record<string, any>) => {
    navigator.clipboard.writeText(JSON.stringify(answers, null, 2));
    toast.success("JSON copiado para a área de transferência!");
  };

  // Helper to format field answer in drawer
  const renderFormattedAnswer = (field: FormField, val: any) => {
    if (val === undefined || val === null || val === "") {
      return <span className="text-zinc-400 italic text-sm">Não respondido</span>;
    }

    switch (field.type) {
      case "checkbox":
      case "select":
      case "radio":
        if (Array.isArray(val)) {
          return (
            <div className="flex flex-wrap gap-1.5">
              {val.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700"
                >
                  {String(item)}
                </span>
              ))}
            </div>
          );
        }
        return <span className="font-medium text-zinc-200">{String(val)}</span>;

      case "switch":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              val ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {val ? "Sim / Ativado" : "Não / Desativado"}
          </span>
        );

      case "date":
        try {
          return (
            <span className="font-medium text-zinc-200">
              {format(new Date(val), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          );
        } catch {
          return <span className="font-medium text-zinc-200">{String(val)}</span>;
        }

      default:
        return (
          <span className="text-zinc-200 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {String(val)}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Form Filter Selector */}
          <div className="relative min-w-[220px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="all">Todos os formulários ({submissions.length})</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por respondente ou conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Submissions Table / Card List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400 border border-zinc-700/50">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">Nenhuma resposta encontrada</h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-4">
            {searchQuery || selectedFormId !== "all"
              ? "Tente ajustar seus filtros de busca ou selecione outro formulário."
              : "Assim que os usuários responderem aos formulários publicados, as entradas aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Formulário</th>
                  <th className="py-3.5 px-4 font-semibold">Identificação</th>
                  <th className="py-3.5 px-4 font-semibold">Data / Hora</th>
                  <th className="py-3.5 px-4 font-semibold">Resumo de Respostas</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSubmissions.map((sub) => {
                  const date = new Date(sub.createdAt);
                  const formattedDate = format(date, "dd/MM/yyyy 'às' HH:mm");
                  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
                  const answersCount = Object.keys(sub.answers || {}).length;

                  // Get first 2 answers as preview
                  const answerPreview = Object.entries(sub.answers || {})
                    .slice(0, 2)
                    .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`)
                    .join(" • ");

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                      onClick={() => setActiveSubmission(sub)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-200 line-clamp-1">{sub.form.title}</div>
                        <span className="text-[11px] text-zinc-500 font-mono">v{sub.formVersion.version}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="font-mono text-xs truncate max-w-[150px]">
                            {sub.respondentId || "Anônimo"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-zinc-200 text-xs font-medium">{formattedDate}</div>
                        <div className="text-zinc-500 text-[11px]">{timeAgo}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-zinc-400 truncate" title={answerPreview}>
                          {answerPreview || `${answersCount} campos preenchidos`}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          {answersCount} respostas
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveSubmission(sub)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                            title="Ver detalhes da resposta"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => setSubmissionToDelete(sub)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Excluir resposta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Submission Details */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-100">Detalhes da Resposta</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono">
                    ID: {activeSubmission.id.slice(-6)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{activeSubmission.form.title}</p>
              </div>
              <button
                onClick={() => setActiveSubmission(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Submission Metadata Card */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Data de Envio</span>
                    <span className="text-zinc-200 font-medium">
                      {format(new Date(activeSubmission.createdAt), "dd/MM/yyyy HH:mm:ss")}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Identificador</span>
                    <span className="text-zinc-200 font-mono font-medium truncate block">
                      {activeSubmission.respondentId || "Anônimo"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Endereço IP</span>
                    <span className="text-zinc-400 font-mono">{activeSubmission.ipAddress || "Não registrado"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Versão do Formulário</span>
                    <span className="text-zinc-400 font-mono">v{activeSubmission.formVersion.version}</span>
                  </div>
                </div>
              </div>

              {/* Answers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
                    Perguntas e Respostas
                  </h3>
                  <button
                    onClick={() => copyAnswersJson(activeSubmission.answers)}
                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar JSON</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {activeSubmission.formVersion.fields.map((field) => {
                    const answerValue = activeSubmission.answers[field.label] !== undefined
                      ? activeSubmission.answers[field.label]
                      : activeSubmission.answers[field.id];

                    return (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-zinc-300">{field.label}</label>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 uppercase font-mono">
                            {field.type}
                          </span>
                        </div>
                        <div className="pt-1">{renderFormattedAnswer(field, answerValue)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between gap-3">
              {canDelete && (
                <button
                  onClick={() => setSubmissionToDelete(activeSubmission)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Resposta</span>
                </button>
              )}
              <button
                onClick={() => setActiveSubmission(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {submissionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Excluir Resposta</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente esta resposta do formulário{" "}
              <strong className="text-zinc-200">"{submissionToDelete.form.title}"</strong>? Esta ação não pode ser
              desfeita e será registrada nos logs de auditoria.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSubmissionToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
