"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  Save,
  Globe,
  Share2,
  Eye,
  Plus,
  Loader2,
  Lock,
  Layers,
  Palette,
  QrCode,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  FormSchema,
  DesignSettings,
  FormField,
  FieldType,
  fieldDefinitions,
  defaultDesignSettings,
} from "@/lib/types/form";
import { FieldLibrary } from "./field-library";
import { FieldItem } from "./field-item";
import { PropertiesPanel } from "./properties-panel";
import { DesignPanel } from "./design-panel";
import { PreviewModal } from "./preview-modal";
import { FormStatus, Role } from "@prisma/client";

interface BuilderClientProps {
  initialForm: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    status: FormStatus;
    _count: { submissions: number };
  };
  initialVersion: {
    id: string;
    version: number;
    schema: unknown;
    designSettings: unknown;
  } | null;
  userRole: Role;
}

export function BuilderClient({
  initialForm,
  initialVersion,
  userRole,
}: BuilderClientProps) {
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState<"builder" | "design">("builder");

  // Schema & Design State
  const initialSchemaParsed: FormSchema = (initialVersion?.schema as FormSchema) || {
    pages: [{ id: "page-1", fields: [] }],
  };
  const [schema, setSchema] = useState<FormSchema>(initialSchemaParsed);

  const initialDesignParsed: DesignSettings =
    (initialVersion?.designSettings as DesignSettings) || defaultDesignSettings;
  const [designSettings, setDesignSettings] = useState<DesignSettings>(
    initialDesignParsed
  );

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Modals & Saving
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const canEdit = userRole === Role.ADMIN || userRole === Role.EDITOR;

  const pages = schema.pages || [{ id: "page-1", fields: [] }];
  const currentPage = pages[activePageIndex] || pages[0] || { id: "page-1", fields: [] };
  const currentFields = currentPage.fields || [];

  const selectedField =
    currentFields.find((f) => f.id === selectedFieldId) || null;

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentFields.findIndex((f) => f.id === active.id);
    const newIndex = currentFields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updatedFields = arrayMove(currentFields, oldIndex, newIndex);
      updatePageFields(updatedFields);
    }
  };

  const updatePageFields = (fields: FormField[]) => {
    const updatedPages = [...pages];
    updatedPages[activePageIndex] = {
      ...currentPage,
      fields,
    };
    setSchema({ pages: updatedPages });
  };

  const handleAddField = (type: FieldType) => {
    const def = fieldDefinitions[type];
    const newField: FormField = {
      id: `f_${type}_${Date.now()}`,
      type,
      label: def.defaultLabel,
      required: false,
      ...(def.hasOptions
        ? {
            options: [
              { id: "opt_1", label: "Primeira Opção", value: "opcao_1" },
              { id: "opt_2", label: "Segunda Opção", value: "opcao_2" },
            ],
          }
        : {}),
    };

    const updatedFields = [...currentFields, newField];
    updatePageFields(updatedFields);
    setSelectedFieldId(newField.id);
    toast.success(`Campo "${def.name}" adicionado ao formulário.`);
  };

  const handleUpdateField = (updated: FormField) => {
    const updatedFields = currentFields.map((f) =>
      f.id === updated.id ? updated : f
    );
    updatePageFields(updatedFields);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = currentFields.filter((f) => f.id !== fieldId);
    updatePageFields(updatedFields);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
    toast.info("Campo removido.");
  };

  const handleDuplicateField = (field: FormField) => {
    const newField: FormField = {
      ...field,
      id: `f_${field.type}_${Date.now()}`,
      label: `${field.label} (Cópia)`,
    };
    const index = currentFields.findIndex((f) => f.id === field.id);
    const updatedFields = [...currentFields];
    updatedFields.splice(index + 1, 0, newField);
    updatePageFields(updatedFields);
    setSelectedFieldId(newField.id);
    toast.success("Campo duplicado com sucesso.");
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentFields.length) return;
    const updatedFields = arrayMove(currentFields, index, targetIndex);
    updatePageFields(updatedFields);
  };

  // Multi-step pages
  const handleAddPage = () => {
    const newPageIndex = pages.length + 1;
    const newPage = {
      id: `page-${Date.now()}`,
      title: `Etapa ${newPageIndex}`,
      description: "",
      fields: [],
    };
    setSchema({ pages: [...pages, newPage] });
    setActivePageIndex(pages.length);
    setSelectedFieldId(null);
    toast.success(`Nova etapa (${newPageIndex}) criada.`);
  };

  const handleRemovePage = (pIndex: number) => {
    if (pages.length <= 1) {
      toast.error("O formulário precisa ter pelo menos uma etapa.");
      return;
    }
    const updatedPages = pages.filter((_, idx) => idx !== pIndex);
    setSchema({ pages: updatedPages });
    setActivePageIndex(Math.max(0, pIndex - 1));
    setSelectedFieldId(null);
    toast.info("Etapa removida.");
  };

  // Save changes to API
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          slug: form.slug,
          schema,
          designSettings,
          createNewVersion: form.status === FormStatus.PUBLISHED,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Formulário salvo com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async () => {
    const nextAction =
      form.status === FormStatus.PUBLISHED ? "unpublish" : "publish";
    try {
      const res = await fetch(`/api/forms/${form.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setForm((prev) => ({ ...prev, status: data.form.status }));
      toast.success(
        nextAction === "publish"
          ? "Formulário publicado e pronto para receber respostas!"
          : "Formulário despublicado (acesso público pausado)."
      );
    } catch {
      toast.error("Erro ao alterar status de publicação");
    }
  };

  const handleOpenShare = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/f/${form.slug}`;
    try {
      const qr = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });
      setQrCodeDataUrl(qr);
      setShareModalOpen(true);
    } catch {
      toast.error("Erro ao gerar link de compartilhamento");
    }
  };

  return (
    <div className="-m-4 md:-m-8 flex flex-col h-[calc(100vh-4rem)] bg-zinc-100 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Top Builder Navigation Bar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/forms"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Voltar para a lista de formulários"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.title}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="font-bold text-sm text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:outline-none transition-colors max-w-[260px] truncate"
            />

            {form.status === FormStatus.PUBLISHED ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Publicado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="w-3 h-3" />
                Rascunho
              </span>
            )}
          </div>
        </div>

        {/* Center: Tabs Switcher (Construtor / Aparência) */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("builder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "builder"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Construtor</span>
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "design"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Aparência</span>
          </button>
        </div>

        {/* Right: Actions (Preview, Share, Publish, Save) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pré-visualizar</span>
          </button>

          {form.status === FormStatus.PUBLISHED && (
            <button
              onClick={handleOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          )}

          {canEdit && (
            <>
              <button
                onClick={handleTogglePublish}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  form.status === FormStatus.PUBLISHED
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {form.status === FormStatus.PUBLISHED ? "Despublicar" : "Publicar"}
                </span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Salvar</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "design" ? (
          <div className="flex-1 overflow-y-auto p-6">
            <DesignPanel
              settings={designSettings}
              onChange={(updated) => setDesignSettings(updated)}
            />
          </div>
        ) : (
          <>
            {/* Left Library Panel */}
            {canEdit && <FieldLibrary onAddField={handleAddField} />}

            {/* Center Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
              {/* Multi-step pagination bar */}
              <div className="w-full max-w-2xl mb-4 flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <div className="flex items-center gap-1.5">
                  {pages.map((p, idx) => (
                    <div key={p.id} className="flex items-center">
                      <button
                        onClick={() => {
                          setActivePageIndex(idx);
                          setSelectedFieldId(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          activePageIndex === idx
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        <span>{p.title || `Etapa ${idx + 1}`}</span>
                        <span className="text-[10px] opacity-70">
                          ({p.fields.length})
                        </span>
                      </button>

                      {pages.length > 1 && activePageIndex === idx && canEdit && (
                        <button
                          onClick={() => handleRemovePage(idx)}
                          className="ml-1 text-zinc-400 hover:text-red-500 p-1"
                          title="Excluir esta etapa"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <button
                    onClick={handleAddPage}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Etapa</span>
                  </button>
                )}
              </div>

              {/* Canvas Card */}
              <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 shadow-sm p-6 sm:p-8 space-y-4">
                {/* Form Header on Canvas */}
                <div className="pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {form.title}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {form.description || "Clique no título no topo para editar."}
                  </p>
                </div>

                {/* Sortable Fields Canvas */}
                {currentFields.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Esta etapa ainda não possui campos
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                      Clique em qualquer componente no painel à esquerda para adicioná-lo aqui.
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={currentFields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {currentFields.map((field, idx) => (
                          <FieldItem
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onSelect={() => setSelectedFieldId(field.id)}
                            onDelete={() => handleDeleteField(field.id)}
                            onDuplicate={() => handleDuplicateField(field)}
                            onMoveUp={() => handleMoveField(idx, "up")}
                            onMoveDown={() => handleMoveField(idx, "down")}
                            isFirst={idx === 0}
                            isLast={idx === currentFields.length - 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Right Properties Panel */}
            {canEdit && (
              <PropertiesPanel
                field={selectedField}
                allFields={currentFields}
                onUpdateField={handleUpdateField}
                onClose={() => setSelectedFieldId(null)}
              />
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <PreviewModal
          title={form.title}
          description={form.description}
          slug={form.slug}
          schema={schema}
          designSettings={designSettings}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Share / QR Code Modal */}
      {shareModalOpen && qrCodeDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-500" />
                <span>Compartilhar Formulário</span>
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white flex items-center justify-center mb-4 shadow-inner">
              <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>

            <p className="text-center text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Link de Acesso Direto
            </p>
            <p className="text-center text-[11px] text-zinc-500 break-all mb-4">
              {typeof window !== "undefined" ? window.location.origin : ""}/f/{form.slug}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/f/${form.slug}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado com sucesso!");
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link Público</span>
              </button>

              <a
                href={`/f/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir em Nova Aba</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
