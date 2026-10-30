"use client";

import React from "react";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  CheckCircle2,
  CheckSquare,
  ToggleRight,
  Globe,
  Heading,
  FileText,
  Plus,
} from "lucide-react";
import { FieldType, fieldDefinitions } from "@/lib/types/form";

interface FieldLibraryProps {
  onAddField: (type: FieldType) => void;
}

const iconsMap: Record<string, React.ElementType> = {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  ChevronDown,
  CheckCircle2,
  CheckSquare,
  ToggleRight,
  Globe,
  Heading,
  FileText,
};

export function FieldLibrary({ onAddField }: FieldLibraryProps) {
  const categories = [
    { id: "text", name: "Textos & Contato" },
    { id: "choice", name: "Opções & Escolhas" },
    { id: "advanced", name: "Datas & Números" },
    { id: "layout", name: "Estrutura & Layout" },
  ];

  const types = Object.entries(fieldDefinitions) as [
    FieldType,
    (typeof fieldDefinitions)[FieldType]
  ][];

  return (
    <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full overflow-y-auto p-4 select-none">
      <div className="mb-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Componentes
        </h3>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
          Clique no campo para adicionar ao canvas
        </p>
      </div>

      <div className="space-y-5">
        {categories.map((cat) => {
          const catFields = types.filter(([, def]) => def.category === cat.id);
          return (
            <div key={cat.id}>
              <span className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {cat.name}
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {catFields.map(([typeKey, def]) => {
                  const Icon = iconsMap[def.icon] || Type;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => onAddField(typeKey)}
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800/60 text-left transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                            {def.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                            {def.description}
                          </p>
                        </div>
                      </div>

                      <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
