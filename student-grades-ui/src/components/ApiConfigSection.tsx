import { KeyRound, Save, Trash2, UserRound } from "lucide-react";

import type { ApiConfigForm, AuthAccount } from "../types";
import { SectionCard } from "./SectionCard";

interface ApiConfigSectionProps {
  api: ApiConfigForm;
  accounts: AuthAccount[];
  activeAccount: AuthAccount | null;
  activeAccountKey: string;
  accountUsername: string;
  accountPassword: string;
  errors: Record<string, string>;
  onChange: (field: keyof ApiConfigForm, value: string) => void;
  onAccountUsernameChange: (value: string) => void;
  onAccountPasswordChange: (value: string) => void;
  onSelectAccount: (value: string) => void;
  onSaveAccount: () => void;
  onDeleteAccount: () => void;
}

export function ApiConfigSection({
  api,
  accounts,
  activeAccount,
  activeAccountKey,
  accountUsername,
  accountPassword,
  errors,
  onChange,
  onAccountUsernameChange,
  onAccountPasswordChange,
  onSelectAccount,
  onSaveAccount,
  onDeleteAccount,
}: ApiConfigSectionProps) {
  return (
    <SectionCard
      eyebrow="Step 2"
      title="API And Accounts"
      description="Choose which account should be active, keep extra accounts locally in this browser, and let the local proxy sign in with the selected credentials before sending grades."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label className="field-label">Active account</label>
            <select
              value={activeAccountKey}
              onChange={(event) => onSelectAccount(event.target.value)}
              className="field-input"
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.key} value={account.key}>
                  {account.username}
                  {account.source === "env" ? " (.env)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              Switching accounts automatically loads the saved subjects linked to that account.
            </p>
          </div>

          <div className="rounded-[24px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.72)] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[rgba(var(--accent),0.12)] p-3 text-[rgb(var(--accent-strong))]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text))]">
                  {activeAccount?.username ?? "No account selected"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {activeAccount
                    ? activeAccount.source === "env"
                      ? "Using the credentials from your workspace .env file."
                      : "Using a local account saved in this browser."
                    : "Add a local account or use the .env account to unlock sending."}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line))] px-3 py-1 text-xs font-semibold text-[rgb(var(--text))]">
                  <KeyRound className="h-3.5 w-3.5" />
                  {activeAccount ? (activeAccount.source === "env" ? "Managed from .env" : "Managed locally") : "Waiting for account"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.72)] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(var(--accent),0.12)] p-3 text-[rgb(var(--accent-strong))]">
              <Save className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Add or update a local account</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Local accounts stay in browser storage on this machine. The built-in .env account is loaded automatically and cannot be deleted here.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]">
            <div>
              <label className="field-label">Username</label>
              <input
                value={accountUsername}
                onChange={(event) => onAccountUsernameChange(event.target.value)}
                placeholder="name@seu.edu.eg"
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                value={accountPassword}
                onChange={(event) => onAccountPasswordChange(event.target.value)}
                placeholder="Password"
                className="field-input"
              />
            </div>

            <button
              type="button"
              onClick={onSaveAccount}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--accent))] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[rgb(var(--accent-strong))]"
            >
              <Save className="h-4 w-4" />
              Save account
            </button>

            <button
              type="button"
              onClick={onDeleteAccount}
              disabled={!activeAccount || activeAccount.source === "env"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 px-4 py-3 text-sm font-semibold text-rose-600 transition enabled:hover:-translate-y-0.5 enabled:hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </div>
        </div>

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
              <span>{activeAccount ? `Ready for ${activeAccount.username}` : "Select an account first"}</span>
              <span className="pill">Managed</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
              The local proxy signs in with the selected account, keeps a separate token cache per account, and uses the .env credentials automatically when you choose the built-in account.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}