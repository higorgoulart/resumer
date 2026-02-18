import React from "react";
import type {
  ResumeData,
  ResumeSection,
  ExperienceSectionSchema,
  EducationSectionSchema,
  SkillsSectionSchema,
  CustomSectionSchema,
} from "../types";
import { z } from "zod";

type ExperienceSection = z.infer<typeof ExperienceSectionSchema>;

export const ExperienceSection: React.FC<{ section: ExperienceSection }> = ({
  section,
}) => (
  <div className="space-y-4">
    {section.items.map((exp, idx) => (
      <div key={idx}>
        <div className="grid grid-cols-[1fr_auto] gap-x-4">
          <span className="text-base font-semibold">{exp.role}</span>
          <span className="text-xs text-gray-700 whitespace-nowrap">
            {exp.duration}
          </span>
        </div>
        <div className="grid grid-cols-2 text-xs text-gray-700">
          <span>{exp.company}</span>
          <span className="text-right">{exp.location}</span>
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {exp.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

type EducationSection = z.infer<typeof EducationSectionSchema>;

export const EducationSection: React.FC<{ section: EducationSection }> = ({
  section,
}) => (
  <div className="space-y-3">
    {section.items.map((edu, idx) => (
      <div key={idx}>
        <div className="grid grid-cols-[1fr_auto] gap-x-4">
          <span className="font-semibold text-base">
            {edu.degree}
            {edu.gpa && (
              <span className="text-xs text-gray-700">, GPA: {edu.gpa}</span>
            )}
          </span>
          <span className="text-xs text-gray-700 whitespace-nowrap">
            {edu.duration}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-x-4 text-xs text-gray-700">
          <span>{edu.institution}</span>
          <span>{edu.location}</span>
        </div>
      </div>
    ))}
  </div>
);

type SkillsSection = z.infer<typeof SkillsSectionSchema>;

export const SkillsSection: React.FC<{ section: SkillsSection }> = ({
  section,
}) => (
  <div className="space-y-2">
    {section.items.map((skill, idx) => (
      <div key={idx}>
        <span className="font-semibold">{skill.category}: </span>
        <span className="text-gray-700">{skill.items.join(", ")}</span>
      </div>
    ))}
  </div>
);

type CustomSection = z.infer<typeof CustomSectionSchema>;

export const CustomSection: React.FC<{ section: CustomSection }> = ({
  section,
}) => (
  <div className="space-y-3">
    {section.items.map((item, idx) => (
      <div key={idx}>
        <p className="font-semibold">{item.label}</p>
        {item.value && <p className="text-gray-700">{item.value}</p>}
        {item.bullets && (
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {item.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    ))}
  </div>
);

const SectionWrapper: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section className="mt-6 print:mt-4">
    <h2 className="mb-2 border-b border-gray-300 pb-1 text-base font-semibold uppercase tracking-wide text-gray-700 print:text-black">
      {title}
    </h2>
    {children}
  </section>
);

const renderers: Record<
  ResumeSection["type"],
  React.FC<{ section: any }>
> = {
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
  custom: CustomSection,
};

interface ResumeProps {
  data: ResumeData;
}

const Resume: React.FC<ResumeProps> = ({ data }) => {
  return (
    <div
      id="resume"
      className="mx-auto bg-white p-8 text-sm text-gray-900 max-w-[210mm]"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <h2 className="text-xl text-gray-700">{data.title}</h2>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <span>{data.phone}</span>
          <span>{data.email}</span>
          <span>{data.location}</span>
          {data.nationality && <span>{data.nationality}</span>}
          {data.extraField && <span>{data.extraField}</span>}
        </div>
      </header>

      <SectionWrapper title="Summary">
        <p className="leading-relaxed">{data.summary}</p>
      </SectionWrapper>

      {data.sections.map((section) => {
        const Renderer = renderers[section.type];
        return (
          <SectionWrapper key={section.id} title={section.title}>
            <Renderer section={section} />
          </SectionWrapper>
        );
      })}
    </div>
  );
};

export default Resume;
