import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import type { FeedbackState } from "../types";

interface FeedbackBannerProps {
  feedback: FeedbackState;
  onDismiss: () => void;
}

const feedbackStyles = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  error: {
    icon: AlertCircle,
    className: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  info: {
    icon: Info,
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
} as const;

export function FeedbackBanner({ feedback, onDismiss }: FeedbackBannerProps) {
  const currentStyle = feedbackStyles[feedback.type];
  const Icon = currentStyle.icon;

  return (
    <div className={`rounded-3xl border px-5 py-4 ${currentStyle.className}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{feedback.title}</p>
          <p className="mt-1 text-sm leading-6">{feedback.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 transition hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}