import { useState } from "react";
import type { ResumeData, ResumeSection } from "../types";
import { nanoid } from "nanoid";
import { autofillFromResume } from "../services/ats.service";

interface Props {
  resumeData: ResumeData;
  apiKey: string;
  onChange: (resumeData: ResumeData) => void;
  setError: (error: string) => void;
}

export default function ResumeForm({ resumeData, apiKey, onChange, setError }: Props) {
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) =>
    onChange({ ...resumeData, [key]: val });

  const updateSection = (index: number, section: ResumeSection) => {
    const next = [...resumeData.sections];
    next[index] = section;
    update("sections", next);
  };

  const removeSection = (index: number) =>
    update(
      "sections",
      resumeData.sections.filter((_, i) => i !== index)
    );

  const addSection = (type: ResumeSection["type"]) => {
    const base = {
      id: nanoid(),
      title:
        type === "experience"
          ? "Experience"
          : type === "education"
          ? "Education"
          : type === "skills"
          ? "Skills"
          : "Custom Section",
      type,
      items: [],
    } as ResumeSection;

    update("sections", [...resumeData.sections, base]);
  };

  const handleResumeAutofill = async (file: File) => {
    if (!apiKey) {
      setError('Please configure your API key first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await autofillFromResume(file, apiKey);
      onChange(data);
    } catch (err: any) {
      setError(err.message || 'Failed to autofill Resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="col-span-12 lg:col-span-3 bg-base-100 rounded-xl shadow p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Edit Resume</h2>
        <label className="btn btn-xs btn-primary">
          {loading ? 'Processing…' : 'Upload PDF'}
          <input
            type="file"
            accept=".pdf"
            hidden
            disabled={loading}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleResumeAutofill(file);
            }}
          />
        </label>
      </div>
      <Section title="About" columns>
        <Input label="Name" value={resumeData.name} onChange={(v: string) => update("name", v)} />
        <Input label="Title" value={resumeData.title} onChange={(v: string) => update("title", v)} />
        <Input label="Location" value={resumeData.location} onChange={(v: string) => update("location", v)} />
        <Input
          label="Nationality"
          value={resumeData.nationality || ""}
          onChange={(v: string | undefined) => update("nationality", v)}
        />
        <Input label="Email" value={resumeData.email} onChange={(v: string) => update("email", v)} />
        <Input label="Phone" value={resumeData.phone} onChange={(v: string) => update("phone", v)} />
        <Input
          label="Extra Field"
          value={resumeData.extraField || ""}
          onChange={(v: string | undefined) => update("extraField", v)}
        />
        <Textarea
          label="Summary"
          value={resumeData.summary}
          onChange={(v: string) => update("summary", v)}
        />
      </Section>

      <Section title="Add Section">
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-sm" onClick={() => addSection("experience")}>
            + Experience
          </button>
          <button className="btn btn-sm" onClick={() => addSection("education")}>
            + Education
          </button>
          <button className="btn btn-sm" onClick={() => addSection("skills")}>
            + Skills
          </button>
          <button className="btn btn-sm" onClick={() => addSection("custom")}>
            + Custom
          </button>
        </div>
      </Section>

      {resumeData.sections.map((section, index) => (
        <Section
          key={section.id}
          title={section.title}
          updateSection={(v: any) => updateSection(index, { ...section, title: v })}
          onAdd={() => {
            const items: any[] = [...section.items];
            if (section.type === "experience")
              items.push({
                role: "",
                company: "",
                duration: "",
                location: "",
                bullets: [],
              });
            if (section.type === "education")
              items.push({
                degree: "",
                institution: "",
                duration: "",
                location: "",
                gpa: "",
              });
            if (section.type === "skills")
              items.push({ category: "", items: [] });
            if (section.type === "custom")
              items.push({ label: "", value: "", bullets: [] });

            updateSection(index, { ...section, items });
          }}
        >
          {section.items.map((item: any, i: number) => {
            const updateItem = (patch: any) => {
              const items = section.items.map((it, idx) =>
                idx === i ? { ...it, ...patch } : it
              );
              updateSection(index, { ...section, items });
            };

            return (
              <CardItem
                key={i}
                onRemove={() => {
                  const items: any[] = section.items.filter((_, idx) => idx !== i);
                  updateSection(index, { ...section, items });
                }}
              >
                {section.type === "experience" && (
                  <>
                    <Input label="Role" value={item.role} onChange={(v: any) => updateItem({ role: v })} />
                    <Input label="Company" value={item.company} onChange={(v: any) => updateItem({ company: v })} />
                    <Input label="Location" value={item.location} onChange={(v: any) => updateItem({ location: v })} />
                    <Input label="Duration" value={item.duration} onChange={(v: any) => updateItem({ duration: v })} />
                    <Textarea
                      label="Bullets"
                      value={item.bullets.join("\n")}
                      onChange={(v: string) => updateItem({ bullets: v.split("\n") })}
                    />
                  </>
                )}

                {section.type === "education" && (
                  <>
                    <Input label="Degree" value={item.degree} onChange={(v: any) => updateItem({ degree: v })} />
                    <Input
                      label="Institution"
                      value={item.institution}
                      onChange={(v: any) => updateItem({ institution: v })}
                    />
                    <Input label="Location" value={item.location} onChange={(v: any) => updateItem({ location: v })} />
                    <Input label="Duration" value={item.duration} onChange={(v: any) => updateItem({ duration: v })} />
                    <Input label="GPA" value={item.gpa} onChange={(v: any) => updateItem({ gpa: v })} />
                  </>
                )}

                {section.type === "skills" && (
                  <>
                    <Input
                      label="Category"
                      value={item.category}
                      onChange={(v: any) => updateItem({ category: v })}
                    />
                    <Textarea
                      label="Items"
                      value={item.items.join("\n")}
                      onChange={(v: string) => updateItem({ items: v.split("\n") })}
                    />
                  </>
                )}

                {section.type === "custom" && (
                  <>
                    <Input label="Label" value={item.label} onChange={(v: any) => updateItem({ label: v })} />
                    <Textarea label="Value" value={item.value} onChange={(v: any) => updateItem({ value: v })} />
                    <Textarea
                      label="Bullets"
                      value={(item.bullets || []).join("\n")}
                      onChange={(v: string) => updateItem({ bullets: v.split("\n") })}
                    />
                  </>
                )}
              </CardItem>
            );
          })}

          <button
            className="btn btn-xs btn-error"
            onClick={() => removeSection(index)}
          >
            Remove section
          </button>
        </Section>
      ))}
    </aside>
  );
}

const Input = ({ label, value, onChange, ghost = false }: any) => (
  <fieldset className="fieldset">
    {label && (<legend className="fieldset-legend">{label}</legend>)}
    <input
      type="text"
      className={`input ${ghost ? "input-ghost font-bold" : ""}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </fieldset>
);

const Textarea = ({ label, value, onChange }: any) => (
  <fieldset className="fieldset md:col-span-2">
    <legend className="fieldset-legend">{label}</legend>
    <textarea
      className="textarea h-24 w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </fieldset>
);

const Section = ({ title, onAdd, children, columns = false, updateSection = null }: any) => (
  <div className="card bg-base-100 shadow-sm w-full mb-2">
    <div className="card-body gap-4">
      <div className="flex items-center justify-between">
        {updateSection
          ? <Input
              value={title}
              ghost
              onChange={updateSection}
            />
          : <h2 className="card-title">{title}</h2>
        }
        {onAdd && (
          <button className="btn btn-sm btn-outline" onClick={onAdd}>
            + Add
          </button>
        )}  
      </div>
      <div className={columns ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        {children}
      </div>
    </div>
  </div>
);

const CardItem = ({ children, onRemove }: any) => (
  <div className="relative rounded-box border border-base-300 bg-base-200 p-4">
    <button
      className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2"
      onClick={onRemove}
    >
      ✕
    </button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);
