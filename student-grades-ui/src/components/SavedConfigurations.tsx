import { Bookmark, Download, Save, Trash2 } from "lucide-react";
import type { SavedSubjectPreset } from "../types";

interface SavedConfigurationsProps {
  presetName: string;
  selectedPresetId: string;
  savedSubjects: SavedSubjectPreset[];
  onPresetNameChange: (value: string) => void;
  onSelectPreset: (value: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
}

export function SavedConfigurations({
  presetName,
  selectedPresetId,
  savedSubjects,
  onPresetNameChange,
  onSelectPreset,
  onSave,
  onLoad,
  onDelete,
}: SavedConfigurationsProps) {
  return (
    <div className="rounded-[24px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.72)] p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[rgba(var(--accent),0.12)] p-3 text-[rgb(var(--accent-strong))]">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text))]">Saved subject setups</h3>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Save repeatable subject mappings and metadata into the project file <span className="font-semibold">saved-subjects.json</span>. Authentication stays on the local server and out of saved presets.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]">
        <div>
          <label className="field-label">Preset name</label>
          <input
            value={presetName}
            onChange={(event) => onPresetNameChange(event.target.value)}
            placeholder="Example: HR Midterm"
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Saved presets</label>
          <select
            value={selectedPresetId}
            onChange={(event) => onSelectPreset(event.target.value)}
            className="field-input"
          >
            <option value="">Select a saved subject</option>
            {savedSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--accent))] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[rgb(var(--accent-strong))]"
        >
          <Save className="h-4 w-4" />
          Save
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onLoad}
            disabled={!selectedPresetId}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgb(var(--line))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text))] transition enabled:hover:-translate-y-0.5 enabled:hover:border-[rgb(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Load
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!selectedPresetId}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 px-4 py-3 text-sm font-semibold text-rose-600 transition enabled:hover:-translate-y-0.5 enabled:hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {savedSubjects.length === 0 ? (
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">No saved presets yet. Save one after configuring a subject once and it will be written to the project file.</p>
      ) : null}
    </div>
  );
}