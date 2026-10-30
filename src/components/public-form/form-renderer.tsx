"use client";

import React, { useState } from "react";
import {
  FormSchema,
  DesignSettings,
  FormField,
  isFieldVisible,
} from "@/lib/types/form";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  RotateCcw,
  Asterisk,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface FormRendererProps {
  formId: string;
  slug: string;
  title: string;
  description: string | null;
  schema: FormSchema;
  designSettings: DesignSettings;
  isPreview?: boolean;
}

export function FormRenderer({
  slug,
  title,
  description,
  schema,
  designSettings,
  isPreview = false,
}: FormRendererProps) {
  const pages = schema.pages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const currentPage = pages[currentPageIndex] || { fields: [] };
  const isLastPage = currentPageIndex === pages.length - 1;
  const progressPercent = Math.round(
    ((currentPageIndex + 1) / Math.max(pages.length, 1)) * 100
  );

  const handleAnswerChange = (fieldId: string, val: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateCurrentPage = (): boolean => {
    const pageErrors: Record<string, string> = {};

    for (const field of currentPage.fields) {
      if (field.type === "heading" || field.type === "paragraph") continue;
      if (!isFieldVisible(field, answers)) continue;

      const val = answers[field.id];

      if (field.required) {
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          pageErrors[field.id] = `O campo "${field.label}" é obrigatório.`;
          continue;
        }
      }

      if (val !== undefined && val !== null && val !== "") {
        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val))) {
            pageErrors[field.id] = "Informe um e-mail válido.";
          }
        } else if (field.type === "url") {
          try {
            const parsed = new URL(String(val));
            if (!["http:", "https:"].includes(parsed.protocol)) {
              pageErrors[field.id] = "O link deve iniciar com http:// ou https://";
            }
          } catch {
            pageErrors[field.id] = "Informe uma URL válida (ex: https://exemplo.com).";
          }
        } else if (field.type === "number") {
          const num = Number(val);
          if (isNaN(num)) {
            pageErrors[field.id] = "Informe um número válido.";
          } else if (field.min !== undefined && num < field.min) {
            pageErrors[field.id] = `Valor mínimo: ${field.min}`;
          } else if (field.max !== undefined && num > field.max) {
            pageErrors[field.id] = `Valor máximo: ${field.max}`;
          }
        }
      }
    }

    setErrors(pageErrors);
    return Object.keys(pageErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentPage()) {
      toast.error("Por favor, preencha os campos obrigatórios antes de prosseguir.");
      return;
    }
    setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentPage()) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (isPreview) {
      toast.info("Modo de Pré-visualização: Resposta simulada com sucesso!");
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/f/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          _hp: honeypot, // Honeypot spam defense
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.error || "Falha ao enviar resposta");
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar formulário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setCurrentPageIndex(0);
    setSubmitted(false);
  };

  // Convert radius settings to Tailwind / inline styles
  const buttonRadiusClass =
    designSettings.buttonRadius === "none"
      ? "rounded-none"
      : designSettings.buttonRadius === "sm"
      ? "rounded-sm"
      : designSettings.buttonRadius === "lg"
      ? "rounded-xl"
      : designSettings.buttonRadius === "full"
      ? "rounded-full"
      : "rounded-lg";

  const cardRadiusClass =
    designSettings.cardRadius === "none"
      ? "rounded-none"
      : designSettings.cardRadius === "sm"
      ? "rounded-md"
      : designSettings.cardRadius === "lg"
      ? "rounded-2xl"
      : designSettings.cardRadius === "2xl"
      ? "rounded-3xl"
      : "rounded-xl";

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 transition-colors"
        style={{ backgroundColor: designSettings.backgroundColor }}
      >
        <div
          className={`w-full max-w-lg p-8 sm:p-12 text-center shadow-2xl border border-white/10 ${cardRadiusClass}`}
          style={{
            backgroundColor: designSettings.surfaceColor,
            color: designSettings.textColor,
          }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg"
            style={{ backgroundColor: `${designSettings.primaryColor}20`, color: designSettings.primaryColor }}
          >
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-2">
            {designSettings.successTitle || "Resposta enviada com sucesso!"}
          </h2>
          <p className="text-sm opacity-80 mb-8 max-w-md mx-auto leading-relaxed">
            {designSettings.successMessage || "Obrigado por responder. Seus dados foram salvos com segurança."}
          </p>

          {designSettings.allowMultipleSubmissions && (
            <button
              onClick={handleReset}
              className={`inline-flex items-center gap-2 px-6 py-3 font-semibold text-xs text-white shadow-md active:scale-95 transition-all ${buttonRadiusClass}`}
              style={{ backgroundColor: designSettings.primaryColor }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Preencher Novamente</span>
            </button>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] opacity-40">
            Criado com <strong className="font-semibold">FormFlow</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 flex flex-col justify-between transition-colors"
      style={{
        backgroundColor: designSettings.backgroundColor,
        color: designSettings.textColor,
      }}
    >
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        {/* Header: Logo, Title & Description */}
        <div
          className={`mb-8 ${
            designSettings.headerAlign === "center" ? "text-center" : "text-left"
          }`}
        >
          {designSettings.logoUrl && (
            <img
              src={designSettings.logoUrl}
              alt="Logo"
              className="h-10 object-contain mb-4 inline-block"
            />
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {title}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm opacity-70 mt-2 max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          )}

          {/* Multi-step progress bar */}
          {pages.length > 1 && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs opacity-70 mb-1.5 font-medium">
                <span>
                  Etapa {currentPageIndex + 1} de {pages.length}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: designSettings.primaryColor,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Form Card */}
        <form
          onSubmit={handleSubmit}
          className={`p-6 sm:p-10 shadow-xl border border-white/10 backdrop-blur-md space-y-6 ${cardRadiusClass}`}
          style={{ backgroundColor: designSettings.surfaceColor }}
        >
          {/* Honeypot hidden input for spam bots */}
          <input
            type="text"
            name="_hp"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Page subtitle if multi-page */}
          {currentPage.title && pages.length > 1 && (
            <div className="pb-2 border-b border-white/10">
              <h2 className="text-lg font-bold">{currentPage.title}</h2>
              {currentPage.description && (
                <p className="text-xs opacity-70 mt-0.5">{currentPage.description}</p>
              )}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-6">
            {currentPage.fields.map((field) => {
              if (!isFieldVisible(field, answers)) return null;

              const errorMsg = errors[field.id];

              return (
                <div key={field.id} className="space-y-1.5">
                  {/* Label */}
                  {field.type !== "heading" && field.type !== "paragraph" && (
                    <label className="block text-xs font-semibold">
                      <span>{field.label}</span>
                      {field.required && (
                        <Asterisk className="w-3 h-3 text-red-500 inline ml-0.5 shrink-0" />
                      )}
                    </label>
                  )}

                  {field.description && field.type !== "heading" && field.type !== "paragraph" && (
                    <p className="text-[11px] opacity-70 mb-1">{field.description}</p>
                  )}

                  {/* Input Element based on type */}
                  {renderPublicInputField(field, answers[field.id], (val) =>
                    handleAnswerChange(field.id, val)
                  )}

                  {/* Error Message */}
                  {errorMsg && (
                    <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </p>
                  )}

                  {field.helpText && (
                    <p className="text-[10px] opacity-50 italic mt-0.5">
                      {field.helpText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls: Back / Next / Submit */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/10">
            {pages.length > 1 && currentPageIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className={`px-4 py-2.5 text-xs font-semibold opacity-70 hover:opacity-100 flex items-center gap-1.5 transition-opacity ${buttonRadiusClass}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {!isLastPage ? (
              <button
                type="button"
                onClick={handleNext}
                className={`px-6 py-2.5 text-xs font-semibold text-white shadow-md flex items-center gap-2 active:scale-98 transition-all ${buttonRadiusClass}`}
                style={{ backgroundColor: designSettings.primaryColor }}
              >
                <span>Próxima Etapa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className={`px-7 py-3 text-xs font-bold text-white shadow-lg flex items-center gap-2 active:scale-98 transition-all disabled:opacity-50 ${buttonRadiusClass}`}
                style={{ backgroundColor: designSettings.primaryColor }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>{designSettings.submitButtonText || "Enviar Resposta"}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Powered by FormFlow Footer */}
      <footer className="text-center text-[11px] opacity-40 mt-8">
        FormFlow Enterprise &bull; Plataforma Segura de Formulários
      </footer>
    </div>
  );
}

function renderPublicInputField(
  field: FormField,
  value: unknown,
  onChange: (val: unknown) => void
) {
  switch (field.type) {
    case "heading":
      return <h2 className="text-xl font-bold pt-2">{field.label}</h2>;

    case "paragraph":
      return <p className="text-xs opacity-80 leading-relaxed">{field.label}</p>;

    case "textarea":
      return (
        <textarea
          rows={3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/15 text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
        />
      );

    case "select":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/15 text-xs focus:outline-none focus:border-indigo-400 transition-all cursor-pointer"
        >
          <option value="" disabled>
            {field.placeholder || "Selecione uma opção..."}
          </option>
          {(field.options || []).map((opt) => (
            <option key={opt.id} value={opt.value} className="bg-zinc-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="space-y-2 mt-2">
          {(field.options || []).map((opt) => {
            const checked = String(value ?? "") === opt.value;
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "bg-white/10 border-indigo-400 shadow-xs"
                    : "bg-black/10 border-white/10 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={checked}
                  onChange={() => onChange(opt.value)}
                  className="w-4 h-4 text-indigo-500 accent-indigo-500"
                />
                <span className="text-xs font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
      );

    case "checkbox": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2 mt-2">
          {(field.options || []).map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "bg-white/10 border-indigo-400 shadow-xs"
                    : "bg-black/10 border-white/10 hover:bg-white/5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, opt.value]);
                    } else {
                      onChange(selected.filter((v) => v !== opt.value));
                    }
                  }}
                  className="w-4 h-4 text-indigo-500 accent-indigo-500 rounded"
                />
                <span className="text-xs font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    case "switch": {
      const checked = Boolean(value);
      return (
        <label className="flex items-center justify-between p-3 rounded-xl bg-black/15 border border-white/15 cursor-pointer">
          <span className="text-xs font-medium">{field.label}</span>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-indigo-500 accent-indigo-500 rounded"
          />
        </label>
      );
    }

    default:
      return (
        <input
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
              ? "date"
              : field.type === "time"
              ? "time"
              : field.type === "email"
              ? "email"
              : field.type === "url"
              ? "url"
              : "text"
          }
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/15 text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
        />
      );
  }
}
