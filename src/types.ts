import { z } from "zod";

const BulletSchema = z.string();

export const ExperienceItemSchema = z.object({
  role: z.string(),
  company: z.string(),
  location: z.string().optional(),
  duration: z.string(),
  bullets: z.array(BulletSchema),
});

export const ExperienceSectionSchema = z.object({
  id: z.string(),
  type: z.literal("experience"),
  title: z.string(),
  items: z.array(ExperienceItemSchema),
});

export const EducationItemSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  duration: z.string(),
  gpa: z.string().optional(),
});

export const EducationSectionSchema = z.object({
  id: z.string(),
  type: z.literal("education"),
  title: z.string(),
  items: z.array(EducationItemSchema),
});

export const SkillsItemSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export const SkillsSectionSchema = z.object({
  id: z.string(),
  type: z.literal("skills"),
  title: z.string(),
  items: z.array(SkillsItemSchema),
});

export const CustomItemSchema = z.object({
  label: z.string(),
  value: z.string().optional(),
  bullets: z.array(BulletSchema).optional(),
});

export const CustomSectionSchema = z.object({
  id: z.string(),
  type: z.literal("custom"),
  title: z.string(),
  items: z.array(CustomItemSchema),
});

export const SectionSchema = z.discriminatedUnion("type", [
  ExperienceSectionSchema,
  EducationSectionSchema,
  SkillsSectionSchema,
  CustomSectionSchema,
]);

export const ResumeSchema = z.object({
  name: z.string(),
  title: z.string(),
  phone: z.string(),
  email: z.string(),
  location: z.string(),
  nationality: z.string().optional(),
  extraField: z.string().optional(),
  summary: z.string(),
  sections: z.array(SectionSchema),
});

export type ResumeData = z.infer<typeof ResumeSchema>;
export type ResumeSection = z.infer<typeof SectionSchema>;

export const defaultResume: ResumeData = {
  name: '',
  title: '',
  location: '',
  nationality: '',
  extraField: '',
  email: '',
  phone: '',
  summary: '',
  sections: []
};

export const sectionToText = (section: ResumeSection): string => {
  let text = `${section.title}\n`;

  switch (section.type) {
    case "experience":
      section.items.forEach(exp => {
        text += [
          exp.role,
          exp.duration,
          exp.company,
          exp.location,
          ...exp.bullets,
          "",
        ]
          .filter(Boolean)
          .join("\n");
      });
      break;

    case "education":
      section.items.forEach(edu => {
        text += [
          edu.degree,
          edu.duration,
          edu.institution,
          edu.location,
          edu.gpa && `GPA: ${edu.gpa}`,
          "",
        ]
          .filter(Boolean)
          .join("\n");
      });
      break;

    case "skills":
      section.items.forEach(skill => {
        text += `${skill.category}: ${skill.items.join(", ")}\n`;
      });
      break;

    case "custom":
      section.items.forEach(item => {
        text += [
          item.label,
          item.value,
          ...(item.bullets || []),
          "",
        ]
          .filter(Boolean)
          .join("\n");
      });
      break;
  }

  return text + "\n";
};
