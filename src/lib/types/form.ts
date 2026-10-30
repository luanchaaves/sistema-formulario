import { z } from "zod";

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "time"
  | "select"
  | "radio"
  | "checkbox"
  | "switch"
  | "url"
  | "heading"
  | "paragraph";

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than";

export interface ConditionalRule {
  targetFieldId: string;
  operator: ConditionOperator;
  value?: string | number | boolean;
  action: "show" | "hide";
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  defaultValue?: string | number | boolean | string[];
  options?: FieldOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  conditionalRule?: ConditionalRule;
}

export interface FormPage {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
}

export type DesignPreset = "modern" | "dark_premium" | "minimalist" | "corporate";

export interface DesignSettings {
  preset: DesignPreset;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor: string;
  buttonRadius: "none" | "sm" | "md" | "lg" | "full";
  cardRadius: "none" | "sm" | "md" | "lg" | "2xl";
  headerAlign: "left" | "center";
  logoUrl?: string;
  submitButtonText: string;
  successTitle: string;
  successMessage: string;
  allowMultipleSubmissions: boolean;
}

export interface FormSchema {
  pages: FormPage[];
}

export const defaultDesignSettings: DesignSettings = {
  preset: "dark_premium",
  primaryColor: "#6366f1", // Indigo / Violet premium
  backgroundColor: "#09090b", // Deep graphite
  surfaceColor: "#18181b", // Dark grey surface
  textColor: "#f4f4f5", // Soft white
  buttonRadius: "md",
  cardRadius: "lg",
  headerAlign: "center",
  submitButtonText: "Enviar Resposta",
  successTitle: "Resposta enviada com sucesso!",
  successMessage: "Obrigado por responder. Seus dados foram salvos com segurança.",
  allowMultipleSubmissions: true,
};

export const designPresets: Record<DesignPreset, { name: string; description: string; settings: Partial<DesignSettings> }> = {
  dark_premium: {
    name: "Dark Premium",
    description: "Estética Linear/Vercel com grafite profundo e destaques violeta.",
    settings: {
      preset: "dark_premium",
      primaryColor: "#6366f1",
      backgroundColor: "#09090b",
      surfaceColor: "#18181b",
      textColor: "#f4f4f5",
      buttonRadius: "md",
      cardRadius: "lg",
    },
  },
  modern: {
    name: "Moderno",
    description: "Design limpo e vibrante com superfícies de alto contraste.",
    settings: {
      preset: "modern",
      primaryColor: "#4f46e5",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      textColor: "#0f172a",
      buttonRadius: "md",
      cardRadius: "lg",
    },
  },
  minimalist: {
    name: "Minimalista",
    description: "Foco absoluto no conteúdo, tipografia refinada e sem distrações.",
    settings: {
      preset: "minimalist",
      primaryColor: "#18181b",
      backgroundColor: "#ffffff",
      surfaceColor: "#fafafa",
      textColor: "#09090b",
      buttonRadius: "sm",
      cardRadius: "sm",
    },
  },
  corporate: {
    name: "Corporativo",
    description: "Paleta sóbria azul-marinho e cinzas para empresas e órgãos formais.",
    settings: {
      preset: "corporate",
      primaryColor: "#2563eb",
      backgroundColor: "#f1f5f9",
      surfaceColor: "#ffffff",
      textColor: "#1e293b",
      buttonRadius: "sm",
      cardRadius: "md",
    },
  },
};

export const fieldDefinitions: Record<
  FieldType,
  {
    name: string;
    description: string;
    icon: string;
    category: "text" | "choice" | "advanced" | "layout";
    defaultLabel: string;
    hasOptions?: boolean;
    supportsValidation?: boolean;
  }
> = {
  text: {
    name: "Texto Curto",
    description: "Respostas de uma linha, nomes ou títulos curtos",
    icon: "Type",
    category: "text",
    defaultLabel: "Sua resposta",
    supportsValidation: true,
  },
  textarea: {
    name: "Texto Longo",
    description: "Múltiplas linhas para comentários e justificativas",
    icon: "AlignLeft",
    category: "text",
    defaultLabel: "Descreva em detalhes",
    supportsValidation: true,
  },
  email: {
    name: "E-mail",
    description: "Endereço de e-mail com validação de formato",
    icon: "Mail",
    category: "text",
    defaultLabel: "Qual o seu e-mail?",
    supportsValidation: true,
  },
  phone: {
    name: "Telefone",
    description: "Número de contato telefônico ou WhatsApp",
    icon: "Phone",
    category: "text",
    defaultLabel: "Número de telefone",
    supportsValidation: true,
  },
  number: {
    name: "Número",
    description: "Valores numéricos, contagens ou valores monetários",
    icon: "Hash",
    category: "advanced",
    defaultLabel: "Informe um número",
    supportsValidation: true,
  },
  date: {
    name: "Data",
    description: "Seleção de dia, mês e ano",
    icon: "Calendar",
    category: "advanced",
    defaultLabel: "Selecione uma data",
    supportsValidation: true,
  },
  time: {
    name: "Horário",
    description: "Seleção de hora e minutos",
    icon: "Clock",
    category: "advanced",
    defaultLabel: "Informe o horário",
    supportsValidation: true,
  },
  select: {
    name: "Lista Suspensa",
    description: "Menu dropdown para escolha única",
    icon: "ChevronDown",
    category: "choice",
    defaultLabel: "Escolha uma opção",
    hasOptions: true,
  },
  radio: {
    name: "Múltipla Escolha",
    description: "Opções visíveis com seleção exclusiva única",
    icon: "CheckCircle2",
    category: "choice",
    defaultLabel: "Selecione uma alternativa",
    hasOptions: true,
  },
  checkbox: {
    name: "Caixas de Seleção",
    description: "Permite marcar uma ou várias opções simultaneamente",
    icon: "CheckSquare",
    category: "choice",
    defaultLabel: "Marque as opções aplicáveis",
    hasOptions: true,
  },
  switch: {
    name: "Sim / Não",
    description: "Alternador booleano para confirmação direta",
    icon: "ToggleRight",
    category: "choice",
    defaultLabel: "Você concorda com estes termos?",
  },
  url: {
    name: "Link / URL",
    description: "Endereço web válido com protocolo HTTP/HTTPS",
    icon: "Globe",
    category: "advanced",
    defaultLabel: "Insira o link do seu site ou portfólio",
    supportsValidation: true,
  },
  heading: {
    name: "Título de Seção",
    description: "Organiza o formulário visualmente com tópicos de destaque",
    icon: "Heading",
    category: "layout",
    defaultLabel: "Informações Principais",
  },
  paragraph: {
    name: "Texto Explicativo",
    description: "Orientações, avisos e instruções para os respondentes",
    icon: "FileText",
    category: "layout",
    defaultLabel: "Por favor, leia atentamente as instruções antes de prosseguir.",
  },
};

// Evaluate condition on current answers map
export function isFieldVisible(field: FormField, answers: Record<string, unknown>): boolean {
  if (!field.conditionalRule || !field.conditionalRule.targetFieldId) {
    return true;
  }

  const { targetFieldId, operator, value, action } = field.conditionalRule;
  const targetAnswer = answers[targetFieldId];

  let conditionMet = false;

  switch (operator) {
    case "equals":
      conditionMet = String(targetAnswer ?? "") === String(value ?? "");
      break;
    case "not_equals":
      conditionMet = String(targetAnswer ?? "") !== String(value ?? "");
      break;
    case "contains":
      if (Array.isArray(targetAnswer)) {
        conditionMet = targetAnswer.includes(String(value));
      } else {
        conditionMet = String(targetAnswer ?? "").toLowerCase().includes(String(value ?? "").toLowerCase());
      }
      break;
    case "is_empty":
      conditionMet =
        targetAnswer === undefined ||
        targetAnswer === null ||
        targetAnswer === "" ||
        (Array.isArray(targetAnswer) && targetAnswer.length === 0);
      break;
    case "is_not_empty":
      conditionMet =
        targetAnswer !== undefined &&
        targetAnswer !== null &&
        targetAnswer !== "" &&
        (!Array.isArray(targetAnswer) || targetAnswer.length > 0);
      break;
    case "greater_than":
      conditionMet = Number(targetAnswer) > Number(value);
      break;
    case "less_than":
      conditionMet = Number(targetAnswer) < Number(value);
      break;
  }

  return action === "show" ? conditionMet : !conditionMet;
}

// Zod schema for server validation of incoming answers
export function validateSubmissionAnswers(schema: FormSchema, rawAnswers: Record<string, unknown>): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedAnswers: Record<string, unknown>;
} {
  const errors: Record<string, string> = {};
  const sanitizedAnswers: Record<string, unknown> = {};

  const allFields = schema.pages.flatMap((page) => page.fields);

  for (const field of allFields) {
    // Non-input fields do not accept answers
    if (field.type === "heading" || field.type === "paragraph") {
      continue;
    }

    // Check conditional visibility: if field is hidden by rule, it does not require or accept answer
    const visible = isFieldVisible(field, rawAnswers);
    if (!visible) {
      continue;
    }

    const val = rawAnswers[field.id];

    // Check required
    if (field.required) {
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      ) {
        errors[field.id] = `O campo "${field.label}" é obrigatório.`;
        continue;
      }
    }

    if (val === undefined || val === null || val === "") {
      continue;
    }

    // Type specific checks
    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(val))) {
        errors[field.id] = "Por favor, informe um endereço de e-mail válido.";
        continue;
      }
    } else if (field.type === "url") {
      try {
        const parsed = new URL(String(val));
        if (!["http:", "https:"].includes(parsed.protocol)) {
          errors[field.id] = "O link deve iniciar com http:// ou https://";
          continue;
        }
      } catch {
        errors[field.id] = "Informe uma URL válida (ex: https://exemplo.com).";
        continue;
      }
    } else if (field.type === "number") {
      const num = Number(val);
      if (isNaN(num)) {
        errors[field.id] = "O valor deve ser um número válido.";
        continue;
      }
      if (field.min !== undefined && num < field.min) {
        errors[field.id] = `O valor mínimo permitido é ${field.min}.`;
        continue;
      }
      if (field.max !== undefined && num > field.max) {
        errors[field.id] = `O valor máximo permitido é ${field.max}.`;
        continue;
      }
    } else if (field.type === "text" || field.type === "textarea") {
      const str = String(val);
      if (field.minLength !== undefined && str.length < field.minLength) {
        errors[field.id] = `Mínimo de ${field.minLength} caracteres.`;
        continue;
      }
      if (field.maxLength !== undefined && str.length > field.maxLength) {
        errors[field.id] = `Máximo de ${field.maxLength} caracteres.`;
        continue;
      }
    }

    sanitizedAnswers[field.id] = val;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedAnswers,
  };
}
