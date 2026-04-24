import type { MetadataForm } from "../types";
import { SectionCard } from "./SectionCard";

interface MetadataSectionProps {
  metadata: MetadataForm;
  errors: Record<string, string>;
  onChange: (field: keyof MetadataForm, value: string) => void;
}

const metadataFields: Array<{ key: keyof MetadataForm; label: string; placeholder: string }> = [
  { key: "academicYearCode", label: "Academic year code", placeholder: "2025" },
  { key: "semesterCode", label: "Semester code", placeholder: "5" },
  { key: "branchCode", label: "Branch code", placeholder: "1" },
  { key: "facultyCode", label: "Faculty code", placeholder: "2" },
  { key: "sectionCode", label: "Section code", placeholder: "3" },
];

export function MetadataSection({ metadata, errors, onChange }: MetadataSectionProps) {
  return (
    <SectionCard
      eyebrow="Step 3"
      title="Academic Metadata"
      description="These numeric fields are attached to every generated payload and must match the target academic context."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metadataFields.map((field) => (
          <div key={field.key}>
            <label className="field-label">{field.label}</label>
            <input
              value={metadata[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              inputMode="numeric"
              placeholder={field.placeholder}
              className="field-input"
            />
            {errors[`metadata.${field.key}`] ? <p className="field-error">{errors[`metadata.${field.key}`]}</p> : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}