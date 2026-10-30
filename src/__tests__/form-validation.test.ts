import { describe, it, expect } from "vitest";
import { isFieldVisible, validateSubmissionAnswers, FormSchema, FormField } from "@/lib/types/form";

describe("Conditional Visibility Logic", () => {
  it("should show field unconditionally when no conditionalRule is set", () => {
    const field: FormField = {
      id: "f1",
      type: "text",
      label: "Name",
    };
    expect(isFieldVisible(field, {})).toBe(true);
  });

  it("should show CNPJ only when tipo_pessoa equals PJ", () => {
    const cnpjField: FormField = {
      id: "f_cnpj",
      type: "text",
      label: "CNPJ",
      conditionalRule: {
        targetFieldId: "f_tipo",
        operator: "equals",
        value: "PJ",
        action: "show",
      },
    };

    expect(isFieldVisible(cnpjField, { f_tipo: "PF" })).toBe(false);
    expect(isFieldVisible(cnpjField, { f_tipo: "PJ" })).toBe(true);
    expect(isFieldVisible(cnpjField, {})).toBe(false);
  });

  it("should handle contains operator for multi-select arrays", () => {
    const detailField: FormField = {
      id: "f_detail",
      type: "text",
      label: "Detalhes Adicionais",
      conditionalRule: {
        targetFieldId: "f_services",
        operator: "contains",
        value: "consultoria",
        action: "show",
      },
    };

    expect(isFieldVisible(detailField, { f_services: ["desenvolvimento", "design"] })).toBe(false);
    expect(isFieldVisible(detailField, { f_services: ["consultoria", "design"] })).toBe(true);
  });
});

describe("Submission Validation", () => {
  const schema: FormSchema = {
    pages: [
      {
        id: "p1",
        fields: [
          {
            id: "f_name",
            type: "text",
            label: "Nome Completo",
            required: true,
            minLength: 3,
          },
          {
            id: "f_email",
            type: "email",
            label: "E-mail",
            required: true,
          },
          {
            id: "f_age",
            type: "number",
            label: "Idade",
            min: 18,
            max: 120,
          },
          {
            id: "f_reason",
            type: "text",
            label: "Motivo",
            required: true,
            conditionalRule: {
              targetFieldId: "f_age",
              operator: "greater_than",
              value: 60,
              action: "show",
            },
          },
        ],
      },
    ],
  };

  it("should reject missing required fields", () => {
    const res = validateSubmissionAnswers(schema, {});
    expect(res.isValid).toBe(false);
    expect(res.errors["f_name"]).toBeDefined();
    expect(res.errors["f_email"]).toBeDefined();
  });

  it("should reject invalid email format", () => {
    const res = validateSubmissionAnswers(schema, {
      f_name: "Luan",
      f_email: "invalid-email",
    });
    expect(res.isValid).toBe(false);
    expect(res.errors["f_email"]).toContain("e-mail válido");
  });

  it("should reject number below minimum", () => {
    const res = validateSubmissionAnswers(schema, {
      f_name: "Luan",
      f_email: "luan@exemplo.com",
      f_age: 15,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors["f_age"]).toContain("mínimo permitido é 18");
  });

  it("should skip validation for conditionally hidden fields", () => {
    // f_age is 25 <= 60, so f_reason is hidden and should NOT trigger required error even though empty
    const res = validateSubmissionAnswers(schema, {
      f_name: "Luan Chaves",
      f_email: "luan@exemplo.com",
      f_age: 25,
    });
    expect(res.isValid).toBe(true);
    expect(res.errors["f_reason"]).toBeUndefined();
  });

  it("should require conditional field when condition is met", () => {
    // f_age is 65 > 60, so f_reason becomes visible and required
    const res = validateSubmissionAnswers(schema, {
      f_name: "Luan Chaves",
      f_email: "luan@exemplo.com",
      f_age: 65,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors["f_reason"]).toBeDefined();
  });
});
