import type { ApiConfigForm } from "../types";
import { SectionCard } from "./SectionCard";

interface ApiConfigSectionProps {
  api: ApiConfigForm;
  errors: Record<string, string>;
  onChange: (field: keyof ApiConfigForm, value: string) => void;
}

export function ApiConfigSection({ api, errors, onChange }: ApiConfigSectionProps) {
  return (
    <SectionCard
      eyebrow="Step 4"
      title="API Configuration"
      description="Use the live API URL. Authentication now runs automatically on the local server, which logs in with your project .env credentials, reuses the cached token, and adds the bearer header for every request."
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <label className="field-label">API URL</label>
          <input
            value={api.url}
            onChange={(event) => onChange("url", event.target.value)}
            placeholder="https://api.example.com/grades"
            className="field-input"
          />
          {errors["api.url"] ? <p className="field-error">{errors["api.url"]}</p> : null}
        </div>

        <div>
          <label className="field-label">Authentication</label>
          <div className="field-input flex min-h-[52px] items-center justify-between gap-3 opacity-80">
            <span>Automatic server login enabled</span>
            <span className="pill">Managed</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            The bearer token field is disabled because the Vite server signs in with
            <span className="mx-1 font-semibold">AUTH_USERNAME</span>
            and
            <span className="mx-1 font-semibold">AUTH_PASSWORD</span>
            from your project .env and reuses the shared token cache until it expires.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}