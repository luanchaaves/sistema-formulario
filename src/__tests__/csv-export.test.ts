import { describe, it, expect } from "vitest";
import { sanitizeCsvCell, generateSubmissionsCsv } from "@/lib/export/csv";
import { FormField } from "@/lib/types/form";

describe("CSV Sanitization & Export", () => {
  it("should escape formula injection prefixes (=, +, -, @)", () => {
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe(`"'=SUM(A1:A10)"`);
    expect(sanitizeCsvCell("+123456789")).toBe(`"'+123456789"`);
    expect(sanitizeCsvCell("-cmd|' /C calc'!A0")).toBe(`"'-cmd|' /C calc'!A0"`);
    expect(sanitizeCsvCell("@malicious_call")).toBe(`"'@malicious_call"`);
  });

  it("should handle normal strings, numbers, and booleans safely", () => {
    expect(sanitizeCsvCell("Luan Chaves")).toBe(`"Luan Chaves"`);
    expect(sanitizeCsvCell(42)).toBe(`"42"`);
    expect(sanitizeCsvCell(true)).toBe(`"Sim"`);
    expect(sanitizeCsvCell(false)).toBe(`"Não"`);
  });

  it("should generate CSV with UTF-8 BOM and correct headers", () => {
    const fields: FormField[] = [
      { id: "f_name", type: "text", label: "Nome" },
      { id: "f_email", type: "email", label: "E-mail" },
    ];

    const submissions = [
      {
        id: "sub_1",
        submittedAt: new Date("2026-10-30T10:00:00Z"),
        answers: { f_name: "Maria", f_email: "maria@test.com" },
      },
    ];

    const csv = generateSubmissionsCsv(fields, submissions);
    // Starts with UTF-8 BOM
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("ID da Resposta");
    expect(csv).toContain("Nome");
    expect(csv).toContain("E-mail");
    expect(csv).toContain("sub_1");
    expect(csv).toContain("Maria");
  });
});
