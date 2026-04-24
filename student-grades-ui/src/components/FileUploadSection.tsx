import { FileSpreadsheet, UploadCloud, X } from "lucide-react";

import { SectionCard } from "./SectionCard";

interface FileUploadSectionProps {
  fileName: string | null;
  rowCount: number;
  error?: string;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
}

export function FileUploadSection({
  fileName,
  rowCount,
  error,
  onFileChange,
  onClear,
}: FileUploadSectionProps) {
  return (
    <SectionCard
      eyebrow="Step 1"
      title="Upload Source Spreadsheet"
      description="Select the Excel workbook that contains StudentID and the score columns for the current subject."
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <label className="group relative flex min-h-52 cursor-pointer flex-col justify-between rounded-[28px] border border-dashed border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.9)] p-6 transition hover:border-[rgb(var(--accent))] hover:bg-[rgba(var(--surface),0.96)]">
          <input
            type="file"
            accept=".xlsx"
            className="sr-only"
            onChange={(event) => {
              onFileChange(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
          <div>
            <div className="mb-4 inline-flex rounded-2xl bg-[rgba(var(--accent),0.12)] p-3 text-[rgb(var(--accent-strong))]">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text))]">Drop in your grade sheet or browse</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[rgb(var(--muted))]">
              Accepted format: <span className="font-semibold">.xlsx</span>. The tool reads the first worksheet and validates the required columns before generating JSON.
            </p>
          </div>
          <div className="pill w-fit">Excel only</div>
        </label>

        <div className="rounded-[28px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.8)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl bg-[rgba(var(--accent),0.12)] p-3 text-[rgb(var(--accent-strong))]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            {fileName ? (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-black/5 hover:text-[rgb(var(--text))] dark:hover:bg-white/5"
                aria-label="Clear selected file"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Selected file</p>
              <p className="mt-2 break-all text-sm font-semibold text-[rgb(var(--text))]">
                {fileName ?? "No file selected yet"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Rows ready</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[rgb(var(--text))]">{rowCount}</p>
            </div>
            <p className="text-sm leading-6 text-[rgb(var(--muted))]">
              Required columns: <span className="font-semibold">StudentID</span> plus one column per configured degree item.
            </p>
            {error ? <p className="field-error">{error}</p> : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}