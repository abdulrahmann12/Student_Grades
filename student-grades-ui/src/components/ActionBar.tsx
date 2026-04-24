import type { ReactNode } from "react";

import { LoaderCircle, Send, Sparkles, TestTube2 } from "lucide-react";

interface ActionBarProps {
  generateDisabled: boolean;
  sendDisabled: boolean;
  singleDisabled: boolean;
  busyAction: "send" | "single" | null;
  onGenerate: () => void;
  onSend: () => void;
  onTestSingle: () => void;
}

function ActionButton({
  label,
  icon,
  disabled,
  loading,
  primary,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  loading?: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
        primary
          ? "bg-[rgb(var(--accent))] text-white enabled:hover:-translate-y-0.5 enabled:hover:bg-[rgb(var(--accent-strong))]"
          : "border border-[rgb(var(--line))] bg-[rgba(var(--surface),0.82)] text-[rgb(var(--text))] enabled:hover:-translate-y-0.5 enabled:hover:border-[rgb(var(--accent))]",
        "disabled:cursor-not-allowed disabled:opacity-50",
      ].join(" ")}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

export function ActionBar({
  generateDisabled,
  sendDisabled,
  singleDisabled,
  busyAction,
  onGenerate,
  onSend,
  onTestSingle,
}: ActionBarProps) {
  return (
    <div className="rounded-[28px] border border-[rgb(var(--line))] bg-[rgba(var(--surface),0.9)] p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--accent-strong))]">Step 5</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-[rgb(var(--text))]">Generate, review, and send</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Buttons stay disabled until the required spreadsheet and numeric configuration fields are complete.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionButton
            label="Generate JSON"
            icon={<Sparkles className="h-4 w-4" />}
            disabled={generateDisabled}
            primary
            onClick={onGenerate}
          />
          <ActionButton
            label="Send to API"
            icon={<Send className="h-4 w-4" />}
            disabled={sendDisabled}
            loading={busyAction === "send"}
            onClick={onSend}
          />
          <ActionButton
            label="Test with Single Student"
            icon={<TestTube2 className="h-4 w-4" />}
            disabled={singleDisabled}
            loading={busyAction === "single"}
            onClick={onTestSingle}
          />
        </div>
      </div>
    </div>
  );
}