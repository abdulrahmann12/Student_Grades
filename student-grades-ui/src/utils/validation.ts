import type { AppFormState, ValidationResult } from "../types";

export function validateExcelFile(file: File | null) {
  if (!file) {
    return "Upload an Excel .xlsx file to continue.";
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return "Only .xlsx files are supported.";
  }

  return null;
}

function isWholeNumber(value: string) {
  return /^\d+$/.test(value.trim());
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function setError(fieldErrors: Record<string, string>, key: string, message: string) {
  if (!fieldErrors[key]) {
    fieldErrors[key] = message;
  }
}

export function validateForm(form: AppFormState, selectedFile: File | null): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const fileError = validateExcelFile(selectedFile);

  if (fileError) {
    setError(fieldErrors, "file", fileError);
  }

  if (!isWholeNumber(form.subject.subjectCode)) {
    setError(fieldErrors, "subject.subjectCode", "Subject code must be a whole number.");
  }

  if (form.subject.degreeItems.length === 0) {
    setError(fieldErrors, "subject.degreeItems", "Add at least one degree item.");
  }

  const labelsSeen = new Set<string>();
  const codesSeen = new Set<string>();

  form.subject.degreeItems.forEach((item) => {
    const trimmedLabel = item.label.trim();
    const trimmedCode = item.code.trim();

    if (!trimmedLabel) {
      setError(fieldErrors, `subject.degreeItems.${item.id}.label`, "Column label is required.");
    } else {
      const normalizedLabel = trimmedLabel.toLowerCase();
      if (labelsSeen.has(normalizedLabel)) {
        setError(
          fieldErrors,
          `subject.degreeItems.${item.id}.label`,
          "Each degree column name must be unique.",
        );
      }
      labelsSeen.add(normalizedLabel);
    }

    if (!isWholeNumber(trimmedCode)) {
      setError(
        fieldErrors,
        `subject.degreeItems.${item.id}.code`,
        "Degree code must be a whole number.",
      );
    } else {
      if (codesSeen.has(trimmedCode)) {
        setError(
          fieldErrors,
          `subject.degreeItems.${item.id}.code`,
          "Each degree code must be unique.",
        );
      }
      codesSeen.add(trimmedCode);
    }
  });

  const numericFields: Array<[keyof AppFormState["metadata"], string]> = [
    ["academicYearCode", "Academic year"],
    ["semesterCode", "Semester"],
    ["branchCode", "Branch"],
    ["facultyCode", "Faculty"],
    ["sectionCode", "Section"],
  ];

  numericFields.forEach(([key, label]) => {
    if (!isWholeNumber(form.metadata[key])) {
      setError(fieldErrors, `metadata.${key}`, `${label} code must be a whole number.`);
    }
  });

  if (!form.api.url.trim()) {
    setError(fieldErrors, "api.url", "API URL is required for sending requests.");
  } else if (!isValidUrl(form.api.url.trim())) {
    setError(fieldErrors, "api.url", "Enter a valid API URL.");
  }

  const generateErrorCount = Object.keys(fieldErrors).filter((key) => !key.startsWith("api.")).length;
  const requestErrorCount = Object.keys(fieldErrors).length;

  return {
    fieldErrors,
    generateErrorCount,
    requestErrorCount,
  };
}

export function getBlockingMessages(validation: ValidationResult, scope: "generate" | "request") {
  const entries = Object.entries(validation.fieldErrors).filter(([key]) => {
    if (scope === "request") {
      return true;
    }

    return !key.startsWith("api.");
  });

  return [...new Set(entries.map(([, message]) => message))];
}

export function getFieldError(fieldErrors: Record<string, string>, key: string) {
  return fieldErrors[key];
}