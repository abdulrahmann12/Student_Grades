import type { AppFormState, DegreeItemForm, PreviewState } from "../types";

export const STUDENT_ID_COLUMN = "StudentID";

export const STORAGE_KEYS = {
  draftConfig: "grades-upload:draft-config",
  savedSubjects: "grades-upload:saved-subjects",
  theme: "grades-upload:theme",
} as const;

export const DEFAULT_API_URL =
  "https://api.seu.edu.eg/api/StudentSubjectDegrees/StudentSubjectDegrees1";

export const STUDENT_PAYLOAD_DEFAULTS = {
  studentName: null,
  total: 0,
  gradeLetter: "F",
  isIC: false,
  canSaveDegree: false,
  point: "0",
  subjectRepeatedTimes: 0,
  subjectStatusCode: 1,
} as const;

export const REQUEST_METADATA_DEFAULTS = {
  studentCode: null,
  lang: "ar",
  orderBy: 1,
  committeDegree: 0,
  secondLangCode: 0,
} as const;

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `degree-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDegreeItem(label = "", code = "", isFinal = false): DegreeItemForm {
  return {
    id: createId(),
    label,
    code,
    isFinal,
  };
}

export function createDefaultFormState(): AppFormState {
  return {
    subject: {
      presetName: "",
      subjectCode: "",
      degreeItems: [
        createDegreeItem("Mid", ""),
        createDegreeItem("Final", "", true),
        createDegreeItem("Quiz", ""),
        createDegreeItem("Att", ""),
      ],
    },
    metadata: {
      academicYearCode: "2025",
      semesterCode: "5",
      branchCode: "1",
      facultyCode: "2",
      sectionCode: "3",
    },
    api: {
      url: DEFAULT_API_URL,
    },
  };
}

export function createEmptyPreviewState(): PreviewState {
  return {
    payload: null,
    issues: [],
    rowCount: 0,
    generatedAt: null,
  };
}