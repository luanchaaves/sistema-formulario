"use client";

import React, { useState } from "react";
import { X, Monitor, Smartphone } from "lucide-react";
import { FormRenderer } from "@/components/public-form/form-renderer";
import { FormSchema, DesignSettings } from "@/lib/types/form";

interface PreviewModalProps {
  title: string;
  description: string | null;
  slug: string;
  schema: FormSchema;
  designSettings: DesignSettings;
  onClose: () => void;
}

export function PreviewModal({
  title,
  description,
  slug,
  schema,
  designSettings,
  onClose,
}: PreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-md">
      {/* Top Bar with Device Switcher and Close button */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-200">
            Pré-visualização do Formulário
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
            Modo Interativo
          </span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              device === "desktop"
                ? "bg-zinc-700 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              device === "mobile"
                ? "bg-zinc-700 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
        {device === "desktop" ? (
          <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950">
            <FormRenderer
              formId="preview"
              slug={slug}
              title={title}
              description={description}
              schema={schema}
              designSettings={designSettings}
              isPreview
            />
          </div>
        ) : (
          <div className="w-[380px] h-[720px] rounded-[42px] border-[10px] border-zinc-800 bg-zinc-950 shadow-2xl overflow-y-auto relative ring-1 ring-white/10">
            {/* Mobile simulated notch */}
            <div className="sticky top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-zinc-800 rounded-b-xl z-30 mx-auto" />
            <div className="pt-2">
              <FormRenderer
                formId="preview"
                slug={slug}
                title={title}
                description={description}
                schema={schema}
                designSettings={designSettings}
                isPreview
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
