export type ThemeMode = "light" | "dark";

export interface DegreeItemForm {
  id: string;
  label: string;
  code: string;
  isFinal: boolean;
}

export interface SubjectForm {
  presetName: string;
  subjectCode: string;
  degreeItems: DegreeItemForm[];
}

export interface MetadataForm {
  academicYearCode: string;
  semesterCode: string;
  branchCode: string;
  facultyCode: string;
  sectionCode: string;
}

export interface ApiConfigForm {
  url: string;
}

export interface AppFormState {
  subject: SubjectForm;
  metadata: MetadataForm;
  api: ApiConfigForm;
}

export interface BuiltDegreeItem {
  id: string;
  label: string;
  code: number;
  isFinal: boolean;
}

export interface BuiltConfig {
  subjectCode: number;
  degreeItems: BuiltDegreeItem[];
  metadata: {
    academicYearCode: number;
    semesterCode: number;
    branchCode: number;
    facultyCode: number;
    sectionCode: number;
  };
  api: ApiConfigForm;
}

export type ExcelRow = Record<string, unknown>;

export interface StudentDetail {
  subjectDegreeItemCode: number;
  studentDegree: number;
  isFinal: boolean;
}

export interface StudentPayload {
  studentCode: string | number;
  studentName: null;
  total: number;
  gradeLetter: string;
  isIC: boolean;
  canSaveDegree: boolean;
  point: string;
  subjectRepeatedTimes: number;
  subjectStatusCode: number;
  details: StudentDetail[];
}

export interface GradesPayload {
  studentSubjectDegreeAdd: {
    academicYearCode: number;
    semesterCode: number;
    branchCode: number;
    facultyCode: number;
    subjectCode: number;
    sectionCode: number;
    studentCode: string | number | null;
    lang: string;
    orderBy: number;
    committeDegree: number;
    secondLangCode: number;
  };
  studentSubjectDegreeMain: StudentPayload[];
}

export interface ValidationResult {
  fieldErrors: Record<string, string>;
  generateErrorCount: number;
  requestErrorCount: number;
}

export interface FeedbackState {
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export interface PreviewState {
  payload: GradesPayload | null;
  issues: string[];
  rowCount: number;
  generatedAt: string | null;
}

export interface SavedSubjectPreset {
  id: string;
  name: string;
  subjectCode: string;
  degreeItems: DegreeItemForm[];
  metadata: MetadataForm;
  apiUrl: string;
  updatedAt: string;
}

export interface ApiSuccessResponse {
  status: number;
  data: unknown;
}