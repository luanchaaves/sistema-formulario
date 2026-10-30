"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  ExternalLink,
  Copy,
  QrCode,
  FileEdit,
  Inbox,
  CopyPlus,
  Trash2,
  Archive,
  Globe,
  Lock,
  Calendar,
  Sparkles,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { FormStatus, Role } from "@prisma/client";

interface FormItem {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  updatedAt: string | Date;
  publishedAt: string | Date | null;
  _count: {
    submissions: number;
  };
  owner: {
    name: string;
  };
}

interface FormsClientProps {
  initialForms: FormItem[];
  userRole: Role;
}

export function FormsClient({ initialForms, userRole }: FormsClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState<FormItem[]>(initialForms);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // QR Code Modal State
  const [qrModalData, setQrModalData] = useState<{ title: string; url: string; qrSrc: string } | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<FormItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Form Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const canEdit = userRole === Role.ADMIN || userRole === Role.EDITOR;

  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase())) ||
      f.slug.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || f.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link público copiado para a área de transferência!");
    setActiveMenuId(null);
  };

  const handleOpenQrModal = async (form: FormItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/f/${form.slug}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#09090b",
          light: "#ffffff",
        },
      });
      setQrModalData({ title: form.title, url, qrSrc: qrDataUrl });
      setActiveMenuId(null);
    } catch {
      toast.error("Erro ao gerar QR Code");
    }
  };

  const handleTogglePublish = async (form: FormItem) => {
    const nextAction = form.status === FormStatus.PUBLISHED ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/forms/${form.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForms((prev) =>
        prev.map((item) => (item.id === form.id ? { ...item, status: data.form.status } : item))
      );
      toast.success(
        nextAction === "publish" ? "Formulário publicado com sucesso!" : "Formulário despublicado (agora em rascunho)."
      );
      setActiveMenuId(null);
    } catch {
      toast.error("Erro ao alterar publicação");
    }
  };

  const handleArchive = async (form: FormItem) => {
    try {
      const res = await fetch(`/api/forms/${form.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForms((prev) =>
        prev.map((item) => (item.id === form.id ? { ...item, status: data.form.status } : item))
      );
      toast.success("Formulário arquivado com sucesso.");
      setActiveMenuId(null);
    } catch {
      toast.error("Erro ao arquivar formulário");
    }
  };

  const handleDuplicate = async (form: FormItem) => {
    try {
      const res = await fetch(`/api/forms/${form.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForms((prev) => [
        {
          ...data.form,
          _count: { submissions: 0 },
          owner: { name: "Você" },
        },
        ...prev,
      ]);
      toast.success("Formulário duplicado!");
      setActiveMenuId(null);
      router.push(`/dashboard/forms/${data.form.id}`);
    } catch {
      toast.error("Erro ao duplicar formulário");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/forms/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setForms((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success("Formulário excluído permanentemente");
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao excluir formulário");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Formulário criado! Abrindo editor...");
      setCreateModalOpen(false);
      router.push(`/dashboard/forms/${data.form.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar formulário");
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar formulários por título, slug ou descrição..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "ALL"
                  ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Todos ({forms.length})
            </button>
            <button
              onClick={() => setStatusFilter("PUBLISHED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "PUBLISHED"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Publicados
            </button>
            <button
              onClick={() => setStatusFilter("DRAFT")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "DRAFT"
                  ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Rascunhos
            </button>
            <button
              onClick={() => setStatusFilter("ARCHIVED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "ARCHIVED"
                  ? "bg-white dark:bg-zinc-800 text-zinc-500 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Arquivados
            </button>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Formulário</span>
          </button>
        )}
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30">
          <Sparkles className="w-10 h-10 text-zinc-400 mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Nenhum formulário encontrado
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {search
              ? "Nenhum resultado corresponde aos termos da pesquisa."
              : "Comece criando o seu primeiro formulário inteligente."}
          </p>
          {canEdit && !search && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Agora</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => {
            const isMenuOpen = activeMenuId === form.id;
            const updatedDate = new Date(form.updatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={form.id}
                className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Status Badge & Context Menu */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {form.status === FormStatus.PUBLISHED ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Publicado
                        </span>
                      ) : form.status === FormStatus.DRAFT ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Lock className="w-3 h-3" />
                          Rascunho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                          <Archive className="w-3 h-3" />
                          Arquivado
                        </span>
                      )}
                    </div>

                    {/* 3-dots Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : form.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-30 text-xs"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <Link
                            href={`/dashboard/forms/${form.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Editar Construtor</span>
                          </Link>

                          <Link
                            href={`/dashboard/responses?formId=${form.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            <span>Ver Respostas</span>
                          </Link>

                          {form.status === FormStatus.PUBLISHED && (
                            <>
                              <button
                                onClick={() => handleCopyLink(form.slug)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Link Público</span>
                              </button>

                              <button
                                onClick={() => handleOpenQrModal(form)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Ver QR Code</span>
                              </button>
                            </>
                          )}

                          {canEdit && (
                            <>
                              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                              <button
                                onClick={() => handleDuplicate(form)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                              >
                                <CopyPlus className="w-3.5 h-3.5" />
                                <span>Duplicar</span>
                              </button>

                              <button
                                onClick={() => handleTogglePublish(form)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>
                                  {form.status === FormStatus.PUBLISHED ? "Despublicar" : "Publicar"}
                                </span>
                              </button>

                              {form.status !== FormStatus.ARCHIVED && (
                                <button
                                  onClick={() => handleArchive(form)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>Arquivar</span>
                                </button>
                              )}

                              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteTarget(form);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <Link href={`/dashboard/forms/${form.id}`}>
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {form.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                    {form.description || "Sem descrição definida."}
                  </p>
                </div>

                {/* Card Footer: Responses count & date */}
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Inbox className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{form._count.submissions} respostas</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">
                      Atualizado em {updatedDate}
                    </span>

                    {form.status === FormStatus.PUBLISHED && (
                      <a
                        href={`/f/${form.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Abrir página pública"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                QR Code de Acesso Público
              </h3>
              <button
                onClick={() => setQrModalData(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white flex items-center justify-center shadow-inner mb-4">
              <img
                src={qrModalData.qrSrc}
                alt="QR Code do Formulário"
                className="w-56 h-56 object-contain"
              />
            </div>

            <p className="text-center text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              {qrModalData.title}
            </p>
            <p className="text-center text-[11px] text-zinc-500 break-all mb-4">
              {qrModalData.url}
            </p>

            <button
              onClick={() => {
                navigator.clipboard.writeText(qrModalData.url);
                toast.success("Link copiado!");
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Link do QR Code</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
              Excluir Formulário Permanentemente?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Você está prestes a excluir o formulário{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">{deleteTarget.title}</strong> e
              todas as suas {deleteTarget._count.submissions} respostas associadas. Esta ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Form Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Criar Novo Formulário
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Título do Formulário *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Cadastro de Novos Clientes 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Descrição ou Objetivo (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explique resumidamente para quem se destina este formulário..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    <span>Continuar para o Editor</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
