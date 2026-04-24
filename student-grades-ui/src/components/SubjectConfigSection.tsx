import { Plus, Trash2 } from "lucide-react";

import type { DegreeItemForm, SavedSubjectPreset, SubjectForm } from "../types";
import { SavedConfigurations } from "./SavedConfigurations";
import { SectionCard } from "./SectionCard";

interface SubjectConfigSectionProps {
  subject: SubjectForm;
  savedSubjects: SavedSubjectPreset[];
  selectedPresetId: string;
  errors: Record<string, string>;
  onPresetNameChange: (value: string) => void;
  onSelectPreset: (value: string) => void;
  onSavePreset: () => void;
  onLoadPreset: () => void;
  onDeletePreset: () => void;
  onSubjectCodeChange: (value: string) => void;
  onDegreeItemChange: (
    id: string,
    field: keyof DegreeItemForm,
    value: string | boolean,
  ) => void;
  onAddDegreeItem: () => void;
  onRemoveDegreeItem: (id: string) => void;
}

export function SubjectConfigSection({
  subject,
  savedSubjects,
  selectedPresetId,
  errors,
  onPresetNameChange,
  onSelectPreset,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onSubjectCodeChange,
  onDegreeItemChange,
  onAddDegreeItem,
  onRemoveDegreeItem,
}: SubjectConfigSectionProps) {
  return (
    <SectionCard
      eyebrow="Step 2"
      title="Subject Configuration"
      description="Keep the subject code and degree-to-column mapping editable so the same UI works for any subject without code changes."
    >
      <div className="space-y-6">
        <SavedConfigurations
          presetName={subject.presetName}
          selectedPresetId={selectedPresetId}
          savedSubjects={savedSubjects}
          onPresetNameChange={onPresetNameChange}
          onSelectPreset={onSelectPreset}
          onSave={onSavePreset}
          onLoad={onLoadPreset}
          onDelete={onDeletePreset}
        />

        <div className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr]">
          <div>
            <label className="field-label">Subject code</label>
            <input
              value={subject.subjectCode}
              onChange={(event) => onSubjectCodeChange(event.target.value)}
              inputMode="numeric"
              placeholder="203"
              className="field-input"
            />
            {errors["subject.subjectCode"] ? <p className="field-error">{errors["subject.subjectCode"]}</p> : null}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <label className="field-label">Degree mapping</label>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Match each spreadsheet column label to its numeric API code. Mark the final item explicitly.
                </p>
              </div>
              <button
                type="button"
                onClick={onAddDegreeItem}
                className="inline-flex items-center gap-2 rounded-2xl border border-[rgb(var(--line))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text))] transition hover:-translate-y-0.5 hover:border-[rgb(var(--accent))]"
              >
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>

            <div className="space-y-4">
              {subject.degreeItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-[24px] border border-[rgb(var(--line))] bg-[rgba(var(--surface-strong),0.74)] p-4 md:grid-cols-[1fr_180px_auto_auto] md:items-start"
                >
                  <div>
                    <label className="field-label">Column label</label>
                    <input
                      value={item.label}
                      onChange={(event) => onDegreeItemChange(item.id, "label", event.target.value)}
                      placeholder="Mid"
                      className="field-input"
                    />
                    {errors[`subject.degreeItems.${item.id}.label`] ? (
                      <p className="field-error">{errors[`subject.degreeItems.${item.id}.label`]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="field-label">Numeric code</label>
                    <input
                      value={item.code}
                      onChange={(event) => onDegreeItemChange(item.id, "code", event.target.value)}
                      inputMode="numeric"
                      placeholder="274"
                      className="field-input"
                    />
                    {errors[`subject.degreeItems.${item.id}.code`] ? (
                      <p className="field-error">{errors[`subject.degreeItems.${item.id}.code`]}</p>
                    ) : null}
                  </div>

                  <label className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-[rgb(var(--line))] px-4 py-3 text-sm font-medium text-[rgb(var(--text))]">
                    <input
                      type="checkbox"
                      checked={item.isFinal}
                      onChange={(event) => onDegreeItemChange(item.id, "isFinal", event.target.checked)}
                      className="h-4 w-4 rounded border-[rgb(var(--line))] text-[rgb(var(--accent))]"
                    />
                    Final item
                  </label>

                  <button
                    type="button"
                    onClick={() => onRemoveDegreeItem(item.id)}
                    disabled={subject.degreeItems.length === 1}
                    className="mt-8 inline-flex items-center justify-center rounded-2xl border border-rose-500/30 p-3 text-rose-600 transition enabled:hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
                    aria-label="Remove degree item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {errors["subject.degreeItems"] ? <p className="field-error">{errors["subject.degreeItems"]}</p> : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}