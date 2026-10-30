import { FormField } from "@/lib/types/form";

interface ExportSubmission {
  id: string;
  submittedAt: Date | string;
  answers: Record<string, unknown>;
}

/**
 * Sanitizes cell values against CSV Formula Injection (CWE-1236)
 * Prepends a single quote if the value begins with sensitive characters (=, +, -, @, tab, cr)
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = "";
  if (Array.isArray(value)) {
    str = value.join(", ");
  } else if (typeof value === "object") {
    str = JSON.stringify(value);
  } else if (typeof value === "boolean") {
    str = value ? "Sim" : "Não";
  } else {
    str = String(value);
  }

  // Trim leading whitespace for injection check
  const trimmed = str.trimStart();
  if (
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("\t") ||
    trimmed.startsWith("\r")
  ) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');

  // Wrap in quotes if it contains commas, semicolons, quotes, or newlines
  if (str.includes(",") || str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str}"`;
  }

  return `"${str}"`;
}

/**
 * Generates an Excel-compatible CSV string with UTF-8 BOM
 */
export function generateSubmissionsCsv(
  fields: FormField[],
  submissions: ExportSubmission[]
): string {
  // UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 accents and characters properly
  const BOM = "\uFEFF";

  const inputFields = fields.filter(
    (f) => f.type !== "heading" && f.type !== "paragraph"
  );

  const headers = [
    sanitizeCsvCell("ID da Resposta"),
    sanitizeCsvCell("Data e Horário"),
    ...inputFields.map((f) => sanitizeCsvCell(f.label || f.id)),
  ];

  const rows = submissions.map((sub) => {
    const formattedDate =
      sub.submittedAt instanceof Date
        ? sub.submittedAt.toLocaleString("pt-BR")
        : new Date(sub.submittedAt).toLocaleString("pt-BR");

    const cells = [
      sanitizeCsvCell(sub.id),
      sanitizeCsvCell(formattedDate),
      ...inputFields.map((f) => sanitizeCsvCell(sub.answers[f.id])),
    ];

    return cells.join(";");
  });

  return BOM + [headers.join(";"), ...rows].join("\r\n");
}
