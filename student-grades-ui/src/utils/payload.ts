import type { AppFormState, BuiltConfig, ExcelRow, GradesPayload, StudentPayload } from "../types";
import {
  REQUEST_METADATA_DEFAULTS,
  STUDENT_ID_COLUMN,
  STUDENT_PAYLOAD_DEFAULTS,
} from "./defaults";

export class PayloadBuildError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "PayloadBuildError";
    this.issues = issues;
  }
}

function cleanJson<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanJson(item)) as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      cleanJson(item),
    ]);
    return Object.fromEntries(entries) as T;
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return 0 as T;
  }

  return value;
}

function parseWholeNumber(value: string, label: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    throw new PayloadBuildError(`Invalid ${label}.`, [`${label} must be a whole number.`]);
  }

  return parsed;
}

function buildRuntimeConfig(form: AppFormState): BuiltConfig {
  return {
    subjectCode: parseWholeNumber(form.subject.subjectCode, "subject code"),
    degreeItems: form.subject.degreeItems.map((item) => ({
      id: item.id,
      label: item.label.trim(),
      code: parseWholeNumber(item.code, `${item.label || "degree item"} code`),
      isFinal: item.isFinal,
    })),
    metadata: {
      academicYearCode: parseWholeNumber(form.metadata.academicYearCode, "academic year code"),
      semesterCode: parseWholeNumber(form.metadata.semesterCode, "semester code"),
      branchCode: parseWholeNumber(form.metadata.branchCode, "branch code"),
      facultyCode: parseWholeNumber(form.metadata.facultyCode, "faculty code"),
      sectionCode: parseWholeNumber(form.metadata.sectionCode, "section code"),
    },
    api: form.api,
  };
}

function normalizeStudentCode(rawValue: unknown, rowNumber: number) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    throw new PayloadBuildError("Student code is missing.", [
      `Row ${rowNumber}: ${STUDENT_ID_COLUMN} is missing.`,
    ]);
  }

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return Number.isInteger(rawValue) ? rawValue : String(rawValue);
  }

  const normalized = String(rawValue).trim();

  if (!normalized) {
    throw new PayloadBuildError("Student code is missing.", [
      `Row ${rowNumber}: ${STUDENT_ID_COLUMN} is missing.`,
    ]);
  }

  if (/^\d+\.0+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }

  return normalized;
}

function normalizeDegreeValue(rawValue: unknown, label: string, studentCode: string | number) {
  if (rawValue === null || rawValue === undefined) {
    return 0;
  }

  if (typeof rawValue === "string") {
    const normalized = rawValue.trim();

    if (!normalized) {
      return 0;
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return parsed;
  }

  const parsed = typeof rawValue === "number" ? rawValue : Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export async function parseExcelFile(file: File) {
  const XLSX = await import("xlsx");
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new PayloadBuildError("Spreadsheet is empty.", [
      "The uploaded workbook does not contain any sheets.",
    ]);
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: null });

  if (rows.length === 0) {
    throw new PayloadBuildError("Spreadsheet is empty.", [
      "The uploaded worksheet does not contain any student rows.",
    ]);
  }

  return rows;
}

export function generatePayload(rows: ExcelRow[], form: AppFormState): GradesPayload {
  const config = buildRuntimeConfig(form);
  const issues: string[] = [];

  if (rows.length === 0) {
    throw new PayloadBuildError("Spreadsheet is empty.", [
      "Upload a spreadsheet with at least one student row.",
    ]);
  }

  const availableColumns = new Set(Object.keys(rows[0] ?? {}));
  const requiredColumns = [STUDENT_ID_COLUMN, ...config.degreeItems.map((item) => item.label)];
  const missingColumns = requiredColumns.filter((columnName) => !availableColumns.has(columnName));

  if (missingColumns.length > 0) {
    issues.push(`The spreadsheet is missing required columns: ${missingColumns.join(", ")}.`);
  }

  if (issues.length > 0) {
    throw new PayloadBuildError("Cannot generate JSON yet.", issues);
  }

  const studentPayload = rows.map((row, index) => {
    const rowNumber = index + 2;
    const studentCode = normalizeStudentCode(row[STUDENT_ID_COLUMN], rowNumber);
    const details = config.degreeItems.map((item) => ({
      subjectDegreeItemCode: item.code,
      studentDegree: normalizeDegreeValue(row[item.label], item.label, studentCode),
      isFinal: item.isFinal,
    }));

    return {
      studentCode,
      studentName: STUDENT_PAYLOAD_DEFAULTS.studentName,
      total: STUDENT_PAYLOAD_DEFAULTS.total,
      gradeLetter: STUDENT_PAYLOAD_DEFAULTS.gradeLetter,
      isIC: STUDENT_PAYLOAD_DEFAULTS.isIC,
      canSaveDegree: STUDENT_PAYLOAD_DEFAULTS.canSaveDegree,
      point: STUDENT_PAYLOAD_DEFAULTS.point,
      subjectRepeatedTimes: STUDENT_PAYLOAD_DEFAULTS.subjectRepeatedTimes,
      subjectStatusCode: STUDENT_PAYLOAD_DEFAULTS.subjectStatusCode,
      details,
    } satisfies StudentPayload;
  });

  return cleanJson({
    studentSubjectDegreeAdd: {
      academicYearCode: config.metadata.academicYearCode,
      semesterCode: config.metadata.semesterCode,
      branchCode: config.metadata.branchCode,
      facultyCode: config.metadata.facultyCode,
      subjectCode: config.subjectCode,
      sectionCode: config.metadata.sectionCode,
      studentCode: REQUEST_METADATA_DEFAULTS.studentCode,
      lang: REQUEST_METADATA_DEFAULTS.lang,
      orderBy: REQUEST_METADATA_DEFAULTS.orderBy,
      committeDegree: REQUEST_METADATA_DEFAULTS.committeDegree,
      secondLangCode: REQUEST_METADATA_DEFAULTS.secondLangCode,
    },
    studentSubjectDegreeMain: studentPayload,
  });
}

export function buildSingleStudentPayload(payload: GradesPayload): GradesPayload {
  const firstStudent = payload.studentSubjectDegreeMain[0];

  if (!firstStudent) {
    throw new PayloadBuildError("Student list is empty.", [
      "Generate a payload with at least one student before testing.",
    ]);
  }

  return {
    ...payload,
    studentSubjectDegreeAdd: {
      ...payload.studentSubjectDegreeAdd,
      studentCode: firstStudent.studentCode,
    },
    studentSubjectDegreeMain: [firstStudent],
  };
}