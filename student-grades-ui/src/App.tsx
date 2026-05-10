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
import { fetchDefaultAuthAccount } from "./services/accounts";
import { ApiServiceError, postGrades } from "./services/api";
import { fetchSavedSubjectPresets, saveSavedSubjectPresets } from "./services/presets";
import type {
  ApiConfigForm,
  AuthAccount,
  AuthAccountSummary,
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

function createAccountKey(username: string) {
  return username.trim().toLowerCase() || "default";
}

function sortAccounts(left: AuthAccount, right: AuthAccount) {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function upsertAccount(accounts: AuthAccount[], account: AuthAccount) {
  return [account, ...accounts.filter((item) => item.key !== account.key)].sort(sortAccounts);
}

function mergeDefaultAccount(accounts: AuthAccount[], defaultAccount: AuthAccountSummary) {
  const existing = accounts.find((item) => item.key === defaultAccount.key);

  return upsertAccount(accounts, {
    key: defaultAccount.key,
    username: defaultAccount.username,
    password: existing?.password ?? "",
    source: existing?.source ?? "env",
    updatedAt: existing?.updatedAt ?? new Date().toISOString(),
  });
}

export default function App() {
  const [form, setForm] = useLocalStorage<AppFormState>(
    STORAGE_KEYS.draftConfig,
    createDefaultFormState(),
  );
  const [accounts, setAccounts] = useLocalStorage<AuthAccount[]>(STORAGE_KEYS.accounts, []);
  const [activeAccountKey, setActiveAccountKey] = useLocalStorage<string>(
    STORAGE_KEYS.activeAccountKey,
    "",
  );
  const [accountPresetSelections, setAccountPresetSelections] = useLocalStorage<
    Record<string, string>
  >(STORAGE_KEYS.accountPresetSelections, {});
  const [savedSubjects, setSavedSubjects] = useState<SavedSubjectPreset[]>([]);
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, "light");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState(() => createEmptyPreviewState());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busyAction, setBusyAction] = useState<"send" | "single" | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountsReady, setAccountsReady] = useState(false);
  const [defaultAccount, setDefaultAccount] = useState<AuthAccountSummary | null>(null);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.key === activeAccountKey) ?? null,
    [accounts, activeAccountKey],
  );
  const validation = useMemo(() => validateForm(form, selectedFile), [form, selectedFile]);

  const resetPreview = () => {
    setPreview(createEmptyPreviewState());
  };

  const updateForm = (updater: (current: AppFormState) => AppFormState) => {
    resetPreview();
    setForm(updater);
  };

  const rememberPresetSelection = (accountKey: string, presetId: string) => {
    setAccountPresetSelections((current) => {
      if (!presetId) {
        if (!(accountKey in current)) {
          return current;
        }

        const nextSelections = { ...current };
        delete nextSelections[accountKey];
        return nextSelections;
      }

      if (current[accountKey] === presetId) {
        return current;
      }

      return {
        ...current,
        [accountKey]: presetId,
      };
    });
  };

  const applyPresetToForm = (preset: SavedSubjectPreset) => {
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
  };

  const resetAccountForm = () => {
    updateForm(() => createDefaultFormState());
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    let active = true;

    const loadDefaultAccount = async () => {
      try {
        const nextDefaultAccount = await fetchDefaultAuthAccount();

        if (!active) {
          return;
        }

        setDefaultAccount(nextDefaultAccount);

        if (nextDefaultAccount) {
          setAccounts((current) => mergeDefaultAccount(current, nextDefaultAccount));
          setActiveAccountKey((current) => current || nextDefaultAccount.key);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setFeedback({
          type: "error",
          title: "Unable to load default account",
          message: getErrorMessage(error),
        });
      } finally {
        if (active) {
          setAccountsReady(true);
        }
      }
    };

    void loadDefaultAccount();

    return () => {
      active = false;
    };
  }, [setAccounts, setActiveAccountKey]);

  useEffect(() => {
    if (!accountsReady) {
      return;
    }

    if (accounts.length === 0) {
      if (activeAccountKey) {
        setActiveAccountKey("");
      }
      return;
    }

    if (!accounts.some((account) => account.key === activeAccountKey)) {
      setActiveAccountKey(accounts[0].key);
    }
  }, [accounts, activeAccountKey, accountsReady, setActiveAccountKey]);

  useEffect(() => {
    let active = true;

    if (!accountsReady) {
      return () => {
        active = false;
      };
    }

    if (!activeAccountKey) {
      setSavedSubjects([]);
      setSelectedPresetId("");
      return () => {
        active = false;
      };
    }

    const loadSavedSubjects = async () => {
      try {
        const presets = await fetchSavedSubjectPresets(activeAccountKey);

        if (!active) {
          return;
        }

        setSavedSubjects(presets);

        const preferredPreset =
          presets.find((subject) => subject.id === accountPresetSelections[activeAccountKey]) ??
          presets[0] ??
          null;

        if (preferredPreset) {
          setSelectedPresetId(preferredPreset.id);
          rememberPresetSelection(activeAccountKey, preferredPreset.id);
          applyPresetToForm(preferredPreset);
        } else {
          setSelectedPresetId("");
          rememberPresetSelection(activeAccountKey, "");
          resetAccountForm();
        }
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
  }, [accountPresetSelections, accountsReady, activeAccountKey]);

  const persistSavedSubjects = async (nextSavedSubjects: SavedSubjectPreset[]) => {
    if (!activeAccountKey) {
      throw new Error("Add or select an account before saving subjects.");
    }

    const persisted = await saveSavedSubjectPresets(activeAccountKey, nextSavedSubjects);
    setSavedSubjects(persisted);

    if (selectedPresetId && !persisted.some((item) => item.id === selectedPresetId)) {
      setSelectedPresetId("");
      rememberPresetSelection(activeAccountKey, "");
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
    if (!activeAccount) {
      setFeedback({
        type: "error",
        title: "Account required",
        message: "Add or select an account before sending grades to the API.",
      });
      return;
    }

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
      const response = await postGrades(
        requestPayload,
        form.api,
        activeAccount.source === "local" ? activeAccount : null,
      );
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
    if (!activeAccount) {
      setFeedback({
        type: "error",
        title: "Account required",
        message: "Select an account before saving a subject preset.",
      });
      return;
    }

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
      rememberPresetSelection(activeAccount.key, presetId);
      setFeedback({
        type: "success",
        title: existing ? "Preset updated" : "Preset saved",
        message: `${name} is now available for ${activeAccount.username}.`,
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

    applyPresetToForm(preset);

    if (activeAccountKey) {
      rememberPresetSelection(activeAccountKey, preset.id);
    }

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

      const nextPreset = nextSavedSubjects[0] ?? null;

      if (nextPreset && activeAccountKey) {
        setSelectedPresetId(nextPreset.id);
        rememberPresetSelection(activeAccountKey, nextPreset.id);
        applyPresetToForm(nextPreset);
      } else {
        setSelectedPresetId("");

        if (activeAccountKey) {
          rememberPresetSelection(activeAccountKey, "");
        }

        resetAccountForm();
      }

      setFeedback({
        type: "info",
        title: "Preset deleted",
        message: `${preset.name} has been removed from this account.`,
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

  const handleAccountSave = () => {
    const username = accountUsername.trim();
    const password = accountPassword.trim();

    if (!username || !password) {
      setFeedback({
        type: "error",
        title: "Account details required",
        message: "Enter both username and password before saving a local account.",
      });
      return;
    }

    const nextAccount: AuthAccount = {
      key: createAccountKey(username),
      username,
      password,
      source: "local",
      updatedAt: new Date().toISOString(),
    };
    const isUpdate = accounts.some((account) => account.key === nextAccount.key);

    setAccounts((current) => upsertAccount(current, nextAccount));
    setActiveAccountKey(nextAccount.key);
    setAccountUsername("");
    setAccountPassword("");
    setFeedback({
      type: "success",
      title: isUpdate ? "Account updated" : "Account added",
      message: `${username} is ready. Any saved subjects will stay linked to this account.`,
    });
  };

  const handleAccountDelete = () => {
    if (!activeAccount) {
      return;
    }

    if (activeAccount.source !== "local") {
      setFeedback({
        type: "info",
        title: "Built-in account kept",
        message: "The account loaded from .env stays available automatically and cannot be removed here.",
      });
      return;
    }

    if (defaultAccount?.key === activeAccount.key) {
      const restoredAccount: AuthAccount = {
        key: defaultAccount.key,
        username: defaultAccount.username,
        password: "",
        source: "env",
        updatedAt: new Date().toISOString(),
      };

      setAccounts((current) =>
        upsertAccount(
          current.filter((account) => account.key !== activeAccount.key),
          restoredAccount,
        ),
      );
      setActiveAccountKey(restoredAccount.key);
      setFeedback({
        type: "info",
        title: "Local override removed",
        message: `${activeAccount.username} now uses the .env credentials again.`,
      });
      return;
    }

    const remainingAccounts = accounts.filter((account) => account.key !== activeAccount.key);

    setAccounts(remainingAccounts);
    setActiveAccountKey(remainingAccounts[0]?.key ?? "");
    setFeedback({
      type: "info",
      title: "Account removed",
      message: `${activeAccount.username} has been removed from this browser.`,
    });
  };

  const handlePresetSelection = (value: string) => {
    setSelectedPresetId(value);

    if (activeAccountKey) {
      rememberPresetSelection(activeAccountKey, value);
    }
  };

  const generateDisabled = validation.generateErrorCount > 0 || excelRows.length === 0;
  const sendDisabled =
    validation.requestErrorCount > 0 ||
    excelRows.length === 0 ||
    busyAction !== null ||
    !activeAccount;

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
              <span className="pill">Account-scoped presets</span>
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

        <ApiConfigSection
          api={form.api}
          accounts={accounts}
          activeAccount={activeAccount}
          activeAccountKey={activeAccountKey}
          accountUsername={accountUsername}
          accountPassword={accountPassword}
          errors={validation.fieldErrors}
          onChange={handleApiChange}
          onAccountUsernameChange={setAccountUsername}
          onAccountPasswordChange={setAccountPassword}
          onSelectAccount={setActiveAccountKey}
          onSaveAccount={handleAccountSave}
          onDeleteAccount={handleAccountDelete}
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
          onSelectPreset={handlePresetSelection}
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