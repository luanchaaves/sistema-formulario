"use client";

import React from "react";
import {
  X,
  Plus,
  Trash2,
  GitBranch,
  Sliders,
  CheckCircle,
} from "lucide-react";
import { FormField, FieldOption, ConditionalRule } from "@/lib/types/form";

interface PropertiesPanelProps {
  field: FormField | null;
  allFields: FormField[];
  onUpdateField: (updated: FormField) => void;
  onClose: () => void;
}

export function PropertiesPanel({
  field,
  allFields,
  onUpdateField,
  onClose,
}: PropertiesPanelProps) {
  if (!field) {
    return (
      <div className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 flex flex-col items-center justify-center text-center text-zinc-400 select-none">
        <Sliders className="w-10 h-10 stroke-1 mb-2 opacity-30" />
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Nenhum campo selecionado
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px]">
          Clique em qualquer campo no canvas central para configurar rótulos, validações e regras condicionais.
        </p>
      </div>
    );
  }

  // Other fields available for conditional logic (prevent self-reference and non-input fields)
  const candidateFields = allFields.filter(
    (f) => f.id !== field.id && f.type !== "heading" && f.type !== "paragraph"
  );

  const handleTextChange = (key: keyof FormField, value: unknown) => {
    onUpdateField({ ...field, [key]: value });
  };

  const handleAddOption = () => {
    const opts = field.options ? [...field.options] : [];
    const count = opts.length + 1;
    opts.push({
      id: "opt_" + Date.now(),
      label: `Opção ${count}`,
      value: `opcao_${count}`,
    });
    onUpdateField({ ...field, options: opts });
  };

  const handleUpdateOption = (index: number, key: "label" | "value", val: string) => {
    const opts = [...(field.options || [])];
    opts[index] = { ...opts[index], [key]: val };
    onUpdateField({ ...field, options: opts });
  };

  const handleRemoveOption = (index: number) => {
    const opts = (field.options || []).filter((_, i) => i !== index);
    onUpdateField({ ...field, options: opts });
  };

  const handleToggleConditional = (enable: boolean) => {
    if (!enable) {
      onUpdateField({ ...field, conditionalRule: undefined });
    } else {
      const firstTarget = candidateFields[0]?.id || "";
      onUpdateField({
        ...field,
        conditionalRule: {
          targetFieldId: firstTarget,
          operator: "equals",
          value: "",
          action: "show",
        },
      });
    }
  };

  const handleUpdateConditional = (patch: Partial<ConditionalRule>) => {
    if (!field.conditionalRule) return;
    onUpdateField({
      ...field,
      conditionalRule: {
        ...field.conditionalRule,
        ...patch,
      },
    });
  };

  const isContentField = field.type === "heading" || field.type === "paragraph";

  return (
    <div className="w-80 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full overflow-y-auto p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">
            Propriedades
          </span>
          <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
            {field.label || "Configurações do Campo"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Fechar painel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Label */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            {isContentField ? "Conteúdo do Texto" : "Rótulo / Pergunta"}
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => handleTextChange("label", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        {!isContentField && (
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Subtítulo / Descrição
            </label>
            <input
              type="text"
              value={field.description || ""}
              onChange={(e) => handleTextChange("description", e.target.value)}
              placeholder="Instruções adicionais abaixo do rótulo..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Placeholder */}
        {!isContentField &&
          field.type !== "radio" &&
          field.type !== "checkbox" &&
          field.type !== "switch" && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Texto de Exemplo (Placeholder)
              </label>
              <input
                type="text"
                value={field.placeholder || ""}
                onChange={(e) => handleTextChange("placeholder", e.target.value)}
                placeholder="Ex: joao@email.com"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

        {/* Required Toggle */}
        {!isContentField && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Campo Obrigatório
              </span>
              <span className="text-[10px] text-zinc-400">
                Bloqueia o envio se estiver em branco
              </span>
            </div>
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => handleTextChange("required", e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
            />
          </div>
        )}

        {/* Options Editor (select, radio, checkbox) */}
        {(field.type === "select" ||
          field.type === "radio" ||
          field.type === "checkbox") && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                Opções de Resposta
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(field.options || []).map((opt, idx) => (
                <div key={opt.id || idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleUpdateOption(idx, "label", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    placeholder={`Opção ${idx + 1}`}
                  />
                  {(field.options || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg"
                      title="Remover opção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Numeric validations */}
        {field.type === "number" && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Valor Mínimo
              </label>
              <input
                type="number"
                value={field.min ?? ""}
                onChange={(e) =>
                  handleTextChange("min", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Valor Máximo
              </label>
              <input
                type="number"
                value={field.max ?? ""}
                onChange={(e) =>
                  handleTextChange("max", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>
        )}

        {/* Text length validations */}
        {(field.type === "text" || field.type === "textarea") && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Mín. Caracteres
              </label>
              <input
                type="number"
                value={field.minLength ?? ""}
                onChange={(e) =>
                  handleTextChange(
                    "minLength",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Máx. Caracteres
              </label>
              <input
                type="number"
                value={field.maxLength ?? ""}
                onChange={(e) =>
                  handleTextChange(
                    "maxLength",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>
        )}

        {/* Help text */}
        {!isContentField && (
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Dica de Ajuda
            </label>
            <input
              type="text"
              value={field.helpText || ""}
              onChange={(e) => handleTextChange("helpText", e.target.value)}
              placeholder="Ex: Não compartilhe senhas neste campo"
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Conditional Logic Section */}
        {!isContentField && candidateFields.length > 0 && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Lógica Condicional
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(field.conditionalRule)}
                onChange={(e) => handleToggleConditional(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
              />
            </div>

            {field.conditionalRule && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <span>Regra:</span>
                  <select
                    value={field.conditionalRule.action}
                    onChange={(e) =>
                      handleUpdateConditional({
                        action: e.target.value as "show" | "hide",
                      })
                    }
                    className="bg-transparent font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none"
                  >
                    <option value="show">Mostrar este campo se</option>
                    <option value="hide">Ocultar este campo se</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Campo de Origem
                  </label>
                  <select
                    value={field.conditionalRule.targetFieldId}
                    onChange={(e) =>
                      handleUpdateConditional({ targetFieldId: e.target.value })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                  >
                    {candidateFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Condição
                  </label>
                  <select
                    value={field.conditionalRule.operator}
                    onChange={(e) =>
                      handleUpdateConditional({
                        operator: e.target.value as ConditionalRule["operator"],
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                  >
                    <option value="equals">É igual a</option>
                    <option value="not_equals">É diferente de</option>
                    <option value="contains">Contém</option>
                    <option value="is_empty">Está vazio</option>
                    <option value="is_not_empty">Não está vazio</option>
                    <option value="greater_than">É maior que</option>
                    <option value="less_than">É menor que</option>
                  </select>
                </div>

                {field.conditionalRule.operator !== "is_empty" &&
                  field.conditionalRule.operator !== "is_not_empty" && (
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Valor Esperado
                      </label>
                      <input
                        type="text"
                        value={String(field.conditionalRule.value ?? "")}
                        onChange={(e) =>
                          handleUpdateConditional({ value: e.target.value })
                        }
                        placeholder="Ex: PJ ou Sim"
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                      />
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
