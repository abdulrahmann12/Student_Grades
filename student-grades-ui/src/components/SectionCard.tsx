import type { PropsWithChildren, ReactNode } from "react";

interface SectionCardProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function SectionCard({ eyebrow, title, description, action, children }: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-[rgb(var(--line))] bg-[rgba(var(--surface),0.9)] p-6 shadow-panel backdrop-blur sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--accent-strong))]">
            {eyebrow}
          </p>
          <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--text))]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}