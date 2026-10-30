"use client";

import React from "react";
import {
  Palette,
  Sparkles,
  AlignLeft,
  AlignCenter,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { DesignSettings, designPresets, DesignPreset } from "@/lib/types/form";

interface DesignPanelProps {
  settings: DesignSettings;
  onChange: (updated: DesignSettings) => void;
}

export function DesignPanel({ settings, onChange }: DesignPanelProps) {
  const handlePresetSelect = (presetKey: DesignPreset) => {
    const preset = designPresets[presetKey];
    onChange({
      ...settings,
      ...preset.settings,
      preset: presetKey,
    });
  };

  const handleFieldChange = (key: keyof DesignSettings, value: unknown) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none p-4">
      {/* Presets Selection */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Temas Visuais Prontos (Presets)
          </h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Selecione uma identidade visual balanceada com contraste otimizado.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.entries(designPresets) as [DesignPreset, (typeof designPresets)[DesignPreset]][]).map(
            ([key, p]) => {
              const isSelected = settings.preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetSelect(key)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {p.description}
                  </p>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Colors Customization */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Cores Personalizadas
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cor Primária (Destaques e Botões)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleFieldChange("primaryColor", e.target.value)}
                className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => handleFieldChange("primaryColor", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cor do Fundo da Página
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => handleFieldChange("backgroundColor", e.target.value)}
                className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) => handleFieldChange("backgroundColor", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cor do Card / Superfície
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.surfaceColor}
                onChange={(e) => handleFieldChange("surfaceColor", e.target.value)}
                className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={settings.surfaceColor}
                onChange={(e) => handleFieldChange("surfaceColor", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cor do Texto Principal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => handleFieldChange("textColor", e.target.value)}
                className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => handleFieldChange("textColor", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Geometry and Layout Settings */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          Geometria e Alinhamento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Arredondamento do Botão
            </label>
            <select
              value={settings.buttonRadius}
              onChange={(e) => handleFieldChange("buttonRadius", e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
            >
              <option value="none">Reto (0px)</option>
              <option value="sm">Suave (4px)</option>
              <option value="md">Médio (8px)</option>
              <option value="lg">Arredondado (12px)</option>
              <option value="full">Pílula (Total)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Arredondamento dos Cards
            </label>
            <select
              value={settings.cardRadius}
              onChange={(e) => handleFieldChange("cardRadius", e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
            >
              <option value="none">Reto (0px)</option>
              <option value="sm">Suave (6px)</option>
              <option value="md">Médio (12px)</option>
              <option value="lg">Elegante (16px)</option>
              <option value="2xl">Extra Arredondado (24px)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Alinhamento do Cabeçalho
            </label>
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleFieldChange("headerAlign", "left")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                  settings.headerAlign === "left"
                    ? "bg-white dark:bg-zinc-900 font-semibold shadow-xs"
                    : "text-zinc-500"
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Esquerda</span>
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange("headerAlign", "center")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                  settings.headerAlign === "center"
                    ? "bg-white dark:bg-zinc-900 font-semibold shadow-xs"
                    : "text-zinc-500"
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span>Centro</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            URL do Logotipo da Empresa
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="url"
              value={settings.logoUrl || ""}
              onChange={(e) => handleFieldChange("logoUrl", e.target.value)}
              placeholder="https://suaempresa.com.br/logo.png"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Copy and Success Messages */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          Textos e Finalização
        </h3>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Texto do Botão de Envio
          </label>
          <input
            type="text"
            value={settings.submitButtonText}
            onChange={(e) => handleFieldChange("submitButtonText", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Título da Tela de Sucesso
          </label>
          <input
            type="text"
            value={settings.successTitle}
            onChange={(e) => handleFieldChange("successTitle", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Mensagem de Agradecimento
          </label>
          <textarea
            rows={2}
            value={settings.successMessage}
            onChange={(e) => handleFieldChange("successMessage", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Permitir Novos Envios
            </span>
            <span className="text-[10px] text-zinc-400">
              Exibe o botão &ldquo;Preencher Novamente&rdquo; após a conclusão
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.allowMultipleSubmissions}
            onChange={(e) =>
              handleFieldChange("allowMultipleSubmissions", e.target.checked)
            }
            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
