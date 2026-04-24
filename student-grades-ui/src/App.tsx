import { useEffect, useMemo, useState } from "react";

import { ActionBar } from "./components/ActionBar";
import { ApiConfigSection } from "./components/ApiConfigSection";
import { FeedbackBanner } from "./components/FeedbackBanner";
import { FileUploadSection } from "./components/FileUploadSection";
import { MetadataSection } from "./components/MetadataSection";
import { PreviewSection } from "./components/PreviewSection";
import { SubjectConfigSection } from "./components/SubjectConfigSection";
import { ThemeToggle } from "./components/ThemeToggle";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ApiServiceError, postGrades } from "./services/api";
import { fetchSavedSubjectPresets, saveSavedSubjectPresets } from "./services/presets";
import type {
  ApiConfigForm,
  AppFormState,
  DegreeItemForm,
  FeedbackState,
  MetadataForm,
  SavedSubjectPreset,
  ThemeMode,
} from "./types";
import {
  createDefaultFormState,
  createDegreeItem,
  createEmptyPreviewState,
  createId,
  STORAGE_KEYS,
} from "./utils/defaults";
import {
  buildSingleStudentPayload,
  generatePayload,
  parseExcelFile,
  PayloadBuildError,
} from "./utils/payload";
import { getBlockingMessages, validateExcelFile, validateForm } from "./utils/validation";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export default function App() {
  const [form, setForm] = useLocalStorage<AppFormState>(
    STORAGE_KEYS.draftConfig,
    createDefaultFormState(),
  );
  const [savedSubjects, setSavedSubjects] = useState<SavedSubjectPreset[]>([]);
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, "light");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState(() => createEmptyPreviewState());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busyAction, setBusyAction] = useState<"send" | "single" | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const validation = useMemo(() => validateForm(form, selectedFile), [form, selectedFile]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    let active = true;

    const loadSavedSubjects = async () => {
      try {
        const presets = await fetchSavedSubjectPresets();

        if (!active) {
          return;
        }

        setSavedSubjects(presets);
      } catch (error) {
        if (!active) {
          return;
        }

        setFeedback({
          type: "error",
          title: "Unable to load saved subjects",
          message: getErrorMessage(error),
        });
      }
    };

    void loadSavedSubjects();

    return () => {
      active = false;
    };
  }, []);

  const resetPreview = () => {
    setPreview(createEmptyPreviewState());
  };

  const updateForm = (updater: (current: AppFormState) => AppFormState) => {
    resetPreview();
    setForm(updater);
  };

  const persistSavedSubjects = async (nextSavedSubjects: SavedSubjectPreset[]) => {
    const persisted = await saveSavedSubjectPresets(nextSavedSubjects);
    setSavedSubjects(persisted);

    if (selectedPresetId && !persisted.some((item) => item.id === selectedPresetId)) {
      setSelectedPresetId("");
    }

    return persisted;
  };

  const handleFileChange = async (file: File | null) => {
    resetPreview();

    if (!file) {
      setSelectedFile(null);
      setExcelRows([]);
      return;
    }

    const fileError = validateExcelFile(file);

    if (fileError) {
      setSelectedFile(null);
      setExcelRows([]);
      setFeedback({
        type: "error",
        title: "Invalid file type",
        message: fileError,
      });
      return;
    }

    try {
      const rows = await parseExcelFile(file);
      setSelectedFile(file);
      setExcelRows(rows);
      setFeedback({
        type: "success",
        title: "Spreadsheet loaded",
        message: `${file.name} is ready. ${rows.length} student rows were detected.`,
      });
    } catch (error) {
      setSelectedFile(null);
      setExcelRows([]);
      setFeedback({
        type: "error",
        title: "Unable to read spreadsheet",
        message: getErrorMessage(error),
      });
    }
  };

  const handleClearFile = () => {
    resetPreview();
    setSelectedFile(null);
    setExcelRows([]);
    setFeedback({
      type: "info",
      title: "Spreadsheet cleared",
      message: "Select another workbook to continue.",
    });
  };

  const buildPreview = (scope: "generate" | "request") => {
    const issues = getBlockingMessages(validation, scope);

    if (issues.length > 0) {
      setPreview({
        payload: null,
        issues,
        rowCount: excelRows.length,
        generatedAt: null,
      });
      return null;
    }

    try {
      const payload = generatePayload(excelRows, form);
      const nextPreview = {
        payload,
        issues: [],
        rowCount: excelRows.length,
        generatedAt: new Date().toISOString(),
      };

      setPreview(nextPreview);
      return payload;
    } catch (error) {
      const payloadIssues =
        error instanceof PayloadBuildError ? error.issues : [getErrorMessage(error)];
      setPreview({
        payload: null,
        issues: payloadIssues,
        rowCount: excelRows.length,
        generatedAt: null,
      });
      return null;
    }
  };

  const handleGenerate = () => {
    const payload = buildPreview("generate");

    if (!payload) {
      setFeedback({
        type: "error",
        title: "JSON generation blocked",
        message: "Resolve the highlighted fields and try again.",
      });
      return;
    }

    setFeedback({
      type: "success",
      title: "JSON generated",
      message: `Preview created for ${payload.studentSubjectDegreeMain.length} students.`,
    });
  };

  const sendPayload = async (mode: "send" | "single") => {
    const payload = buildPreview("request");

    if (!payload) {
      setFeedback({
        type: "error",
        title: "Request blocked",
        message: "Complete the required fields before contacting the API.",
      });
      return;
    }

    const requestPayload = mode === "single" ? buildSingleStudentPayload(payload) : payload;
    setBusyAction(mode);

    try {
      const response = await postGrades(requestPayload, form.api);
      setPreview({
        payload: requestPayload,
        issues: [],
        rowCount: requestPayload.studentSubjectDegreeMain.length,
        generatedAt: new Date().toISOString(),
      });
      setFeedback({
        type: "success",
        title: mode === "single" ? "Single-student test succeeded" : "Grades sent successfully",
        message: `API responded with status ${response.status}.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiServiceError ? error.message : getErrorMessage(error);
      setFeedback({
        type: "error",
        title: "API request failed",
        message,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const updateDegreeItem = (
    id: string,
    field: keyof DegreeItemForm,
    value: string | boolean,
  ) => {
    updateForm((current) => ({
      ...current,
      subject: {
        ...current.subject,
        degreeItems: current.subject.degreeItems.map((item) =>
          item.id === id
            ? {
                ...item,
                [field]: value,
              }
            : item,
        ),
      },
    }));
  };

  const addDegreeItem = () => {
    updateForm((current) => ({
      ...current,
      subject: {
        ...current.subject,
        degreeItems: [...current.subject.degreeItems, createDegreeItem()],
      },
    }));
  };

  const removeDegreeItem = (id: string) => {
    updateForm((current) => ({
      ...current,
      subject: {
        ...current.subject,
        degreeItems: current.subject.degreeItems.filter((item) => item.id !== id),
      },
    }));
  };

  const handleSavePreset = async () => {
    const name = form.subject.presetName.trim();

    if (!name) {
      setFeedback({
        type: "error",
        title: "Preset name required",
        message: "Enter a preset name before saving this subject setup.",
      });
      return;
    }

    const existing =
      savedSubjects.find((subject) => subject.id === selectedPresetId) ??
      savedSubjects.find((subject) => subject.name.toLowerCase() === name.toLowerCase());

    const presetId = existing?.id ?? createId();
    const preset: SavedSubjectPreset = {
      id: presetId,
      name,
      subjectCode: form.subject.subjectCode,
      degreeItems: form.subject.degreeItems.map((item) => ({ ...item })),
      metadata: { ...form.metadata },
      apiUrl: form.api.url,
      updatedAt: new Date().toISOString(),
    };

    try {
      const withoutCurrent = savedSubjects.filter((item) => item.id !== presetId);
      const nextSavedSubjects = [preset, ...withoutCurrent].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );

      await persistSavedSubjects(nextSavedSubjects);
      setSelectedPresetId(presetId);
      setFeedback({
        type: "success",
        title: existing ? "Preset updated" : "Preset saved",
        message: `${name} is now available from the project preset file.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        title: "Unable to save preset",
        message: getErrorMessage(error),
      });
    }
  };

  const handleLoadPreset = () => {
    const preset = savedSubjects.find((subject) => subject.id === selectedPresetId);

    if (!preset) {
      setFeedback({
        type: "error",
        title: "No preset selected",
        message: "Choose a saved subject before loading it.",
      });
      return;
    }

    updateForm((current) => ({
      ...current,
      subject: {
        presetName: preset.name,
        subjectCode: preset.subjectCode,
        degreeItems: preset.degreeItems.map((item) => ({ ...item })),
      },
      metadata: { ...preset.metadata },
      api: {
        ...current.api,
        url: preset.apiUrl,
      },
    }));
    setFeedback({
      type: "info",
      title: "Preset loaded",
      message: `${preset.name} is now applied to the form.`,
    });
  };

  const handleDeletePreset = async () => {
    const preset = savedSubjects.find((subject) => subject.id === selectedPresetId);

    if (!preset) {
      return;
    }

    try {
      const nextSavedSubjects = savedSubjects.filter((item) => item.id !== preset.id);

      await persistSavedSubjects(nextSavedSubjects);
      setSelectedPresetId("");
      setFeedback({
        type: "info",
        title: "Preset deleted",
        message: `${preset.name} has been removed from the project preset file.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        title: "Unable to delete preset",
        message: getErrorMessage(error),
      });
    }
  };

  const handleMetadataChange = (field: keyof MetadataForm, value: string) => {
    updateForm((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        [field]: value,
      },
    }));
  };

  const handleApiChange = (field: keyof ApiConfigForm, value: string) => {
    updateForm((current) => ({
      ...current,
      api: {
        ...current.api,
        [field]: value,
      },
    }));
  };

  const generateDisabled = validation.generateErrorCount > 0 || excelRows.length === 0;
  const sendDisabled =
    validation.requestErrorCount > 0 || excelRows.length === 0 || busyAction !== null;

  return (
    <div className="app-shell">
      <header className="relative overflow-hidden rounded-[36px] border border-[rgb(var(--line))] bg-mesh bg-[rgba(var(--surface),0.92)] px-6 py-8 shadow-panel sm:px-8 sm:py-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(var(--accent),0.12)] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--accent-strong))]">
              Student Grades Upload Tool
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] sm:text-5xl">
              Configure once, preview safely, and send grade uploads with confidence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
              This frontend turns the existing grade-upload backend into a clean operator workflow for Excel intake, subject switching, payload review, and API submission.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="pill">Dynamic degree mappings</span>
              <span className="pill">Project subject presets</span>
              <span className="pill">Live JSON preview</span>
            </div>
          </div>

          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          />
        </div>
      </header>

      <main className="mt-6 grid gap-6">
        {feedback ? <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} /> : null}

        <FileUploadSection
          fileName={selectedFile?.name ?? null}
          rowCount={excelRows.length}
          error={validation.fieldErrors.file}
          onFileChange={handleFileChange}
          onClear={handleClearFile}
        />

        <SubjectConfigSection
          subject={form.subject}
          savedSubjects={savedSubjects}
          selectedPresetId={selectedPresetId}
          errors={validation.fieldErrors}
          onPresetNameChange={(value) =>
            updateForm((current) => ({
              ...current,
              subject: {
                ...current.subject,
                presetName: value,
              },
            }))
          }
          onSelectPreset={setSelectedPresetId}
          onSavePreset={() => {
            void handleSavePreset();
          }}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={() => {
            void handleDeletePreset();
          }}
          onSubjectCodeChange={(value) =>
            updateForm((current) => ({
              ...current,
              subject: {
                ...current.subject,
                subjectCode: value,
              },
            }))
          }
          onDegreeItemChange={updateDegreeItem}
          onAddDegreeItem={addDegreeItem}
          onRemoveDegreeItem={removeDegreeItem}
        />

        <MetadataSection
          metadata={form.metadata}
          errors={validation.fieldErrors}
          onChange={handleMetadataChange}
        />

        <ApiConfigSection
          api={form.api}
          errors={validation.fieldErrors}
          onChange={handleApiChange}
        />

        <ActionBar
          generateDisabled={generateDisabled}
          sendDisabled={sendDisabled}
          singleDisabled={sendDisabled}
          busyAction={busyAction}
          onGenerate={handleGenerate}
          onSend={() => void sendPayload("send")}
          onTestSingle={() => void sendPayload("single")}
        />

        <PreviewSection
          payload={preview.payload}
          issues={preview.issues}
          rowCount={preview.rowCount}
          generatedAt={preview.generatedAt}
        />
      </main>
    </div>
  );
}