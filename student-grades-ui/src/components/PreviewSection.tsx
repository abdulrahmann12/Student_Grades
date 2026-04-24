import { AlertTriangle, FileJson2 } from "lucide-react";

import type { GradesPayload } from "../types";
import { SectionCard } from "./SectionCard";

interface PreviewSectionProps {
  payload: GradesPayload | null;
  issues: string[];
  rowCount: number;
  generatedAt: string | null;
}

function formatGeneratedAt(timestamp: string | null) {
  if (!timestamp) {
    return "Not generated yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function PreviewSection({ payload, issues, rowCount, generatedAt }: PreviewSectionProps) {
  const prettyJson = payload ? JSON.stringify(payload, null, 2) : "";
  const studentCount = payload?.studentSubjectDegreeMain.length ?? 0;

  return (
    <SectionCard
      eyebrow="Preview"
      title="Payload Review"
      description="Use the preview to catch missing fields early, verify the JSON shape, and confirm the number of students before sending anything to the API."
      action={<span className="pill">{payload ? `${studentCount} students ready` : "Awaiting JSON"}</span>}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.8)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Rows detected</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[rgb(var(--text))]">{rowCount}</p>
            </div>
            <div className="rounded-[24px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.8)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Last generation</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[rgb(var(--text))]">{formatGeneratedAt(generatedAt)}</p>
            </div>
          </div>

          <div className={`rounded-[24px] border p-4 ${issues.length > 0 ? "border-rose-500/30 bg-rose-500/10" : "border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.8)]"}`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl p-3 ${issues.length > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-[rgba(var(--accent),0.12)] text-[rgb(var(--accent-strong))]"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--text))]">
                  {issues.length > 0 ? "Resolve these issues before sending" : "No blocking issues in the latest preview"}
                </h3>
                {issues.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-rose-700 dark:text-rose-300">
                    {issues.map((issue) => (
                      <li key={issue}>- {issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">All required fields are present. You can send the current payload to the API.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[rgb(var(--line))] bg-slate-950 shadow-panel">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <div className="flex items-center gap-2 text-slate-200">
              <FileJson2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Generated JSON</span>
            </div>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Preview</span>
          </div>

          <div className="max-h-[560px] overflow-auto p-5">
            {payload ? (
              <pre className="font-mono text-sm leading-7 text-slate-200">{prettyJson}</pre>
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm leading-7 text-slate-400">
                Generate JSON to preview the API payload here.
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}