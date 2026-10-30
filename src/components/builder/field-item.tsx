"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  GitBranch,
  Asterisk,
} from "lucide-react";
import { FormField } from "@/lib/types/form";

interface FieldItemProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function FieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: FieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderFieldPreview = () => {
    switch (field.type) {
      case "heading":
        return (
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {field.label || "Título de Seção"}
          </h2>
        );

      case "paragraph":
        return (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {field.label || "Texto explicativo..."}
          </p>
        );

      case "textarea":
        return (
          <div className="w-full h-20 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-400">
            {field.placeholder || "Campo de texto longo..."}
          </div>
        );

      case "select":
        return (
          <div className="w-full h-10 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 px-3 flex items-center justify-between text-xs text-zinc-400">
            <span>{field.placeholder || "Selecione uma opção..."}</span>
            <span className="text-zinc-400 text-xs">&#9662;</span>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2 mt-2">
            {(field.options || []).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
              >
                <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0" />
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2 mt-2">
            {(field.options || []).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
              >
                <div className="w-4 h-4 rounded-md border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0" />
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
            <span>{field.label}</span>
            <div className="w-9 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 p-0.5 flex items-center">
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-10 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 px-3 flex items-center text-xs text-zinc-400">
            {field.placeholder || `Insira ${field.label.toLowerCase()}...`}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative group rounded-2xl border p-4 transition-all cursor-pointer ${
        isDragging ? "opacity-40 shadow-2xl scale-[1.01]" : ""
      } ${
        isSelected
          ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
          : "bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs"
      }`}
    >
      {/* Top Header of Field: Drag Handle, Label, Badges & Quick Action Controls */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Arrastar para reordenar"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Field Label and Required Asterisk */}
          {field.type !== "heading" && field.type !== "paragraph" && (
            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 truncate">
              <span>{field.label}</span>
              {field.required && (
                <Asterisk className="w-3 h-3 text-red-500 shrink-0 inline" />
              )}
            </label>
          )}

          {/* Conditional rule badge */}
          {field.conditionalRule && field.conditionalRule.targetFieldId && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-500/20"
              title="Este campo possui lógica condicional ativa"
            >
              <GitBranch className="w-3 h-3" />
              <span>Condicional</span>
            </span>
          )}
        </div>

        {/* Action icons: Move Up, Move Down, Duplicate, Delete */}
        <div
          className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none"
            title="Mover para cima"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none"
            title="Mover para baixo"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Duplicar campo"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Excluir campo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description / Help text */}
      {field.description && field.type !== "heading" && field.type !== "paragraph" && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
          {field.description}
        </p>
      )}

      {/* Field Input Preview */}
      <div className="mt-1">{renderFieldPreview()}</div>

      {field.helpText && (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 italic">
          Dica: {field.helpText}
        </p>
      )}
    </div>
  );
}
