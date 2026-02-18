import axios from 'axios';
import { extractTextFromPDF } from './pdf.service';
import { ResumeSchema, sectionToText, type ResumeData } from '../types';

export const analyzeResume = async (resumeData: ResumeData, jobDescription: string, apiKey: string) => {
  try {
    if (!apiKey.trim()) {
      throw new Error('Please provide an API key.');
    }

    if (!resumeData) {
      throw new Error('Resume data is required');
    }

    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    const resumeText = getResumeTextFromData(resumeData);

    const prompt = `
You are an expert Applicant Tracking System (ATS) engine. Analyze the JOB DESCRIPTION and RESUME texts below and return ONLY a single JSON object (no extra text, no explanations). Follow the JSON structure exactly and compute numeric scores using the explicit formulas and weights given. Round all final numeric scores to integers.

--- INPUTS ---
Job Description:
${jobDescription}

Resume Text:
${resumeText}

--- PARSING RULES (extract from JD & Resume) ---
From the Job Description, identify:
- title_required (string) — primary job title asked for.
- required_years_experience (integer) — if the JD specifies "X years" for required experience; otherwise null.
- must_have_skills (array of strings) — skills the JD marks as "must", "required", or "essential".
- preferred_skills (array of strings) — skills marked "nice to have", "preferred", or "bonus".
- required_education (string) — any explicit education requirement (e.g., "Bachelor's in CS") or null.
- required_certifications (array of strings) — explicit certification requirements or [].
- responsibilities (array of short strings) — key duties listed.
- soft_skills_requested (array of strings) — soft skills requested in the JD.

From the Resume, extract:
- candidate_titles (array of titles found in experience section).
- total_years_experience (number) — sum or best estimate of professional experience in years.
- skills_found (array of strings) — all technical/hard skills and soft skills found; include counts for each occurrence.
- education_found (string) and certifications_found (array).
- bullets_total (integer) — total number of achievement bullets in experience.
- bullets_quantified (integer) — number of bullets containing numeric quantifiers (%, numbers, $).
- action_verb_count (integer) — count of strong action verbs used (e.g., "led", "designed", "decreased").
- contact_fields_present (object) — { email: true/false, phone: true/false, address: true/false, linkedin_or_portfolio: true/false }.
- formatting_checks: ats_parseability (one of "ok","warning","error"), file_format (e.g., "pdf","docx" or "unknown"), file_size_mb (number or null).
- obvious_spelling_grammar_issues (integer) — count of detected issues.

--- SCORING FORMULA (deterministic) ---
Compute component scores (each component yields a 0–100 number) then combine with weights to produce "match_rate" (0–100 integer).

Weights (sum = 100):
- must_have_skills_weight = 35
- preferred_skills_weight = 10
- experience_weight = 20
- education_and_certs_weight = 10
- title_weight = 5
- ats_formatting_weight = 5
- quantifying_actionverbs_weight = 8
- soft_skills_weight = 7

Component calculations:
1) Must-Have Skills Score:
- If JD has no must_have_skills, component = 100.
- Else component = (matched_must_count / total_must_count) * 100.
- matched_must_count counts exact or close matches (synonyms allowed).

2) Preferred Skills Score:
- If JD has no preferred_skills, component = 100.
- Else component = (matched_preferred_count / total_preferred_count) * 100.

3) Experience Score:
- If required_years_experience is null, component = 100.
- Else ratio = min(total_years_experience / required_years_experience, 1).
  component = ratio * 100.
- Additionally, if total_years_experience < required_years_experience, subtract an experience shortfall penalty = min( (required_years_experience - total_years_experience) * 5, 30 ) from the component (floor 0).

4) Education & Certifications Score:
- Start at 0.
- If required_education is present in JD:
  - If education_found matches or exceeds requirement => add 100.
  - Else add 0.
- For required_certifications:
  - If JD lists N required certs and M are matched, cert_score = (M / N) * 100. If N==0 cert_score = 100.
- Final component = average of education score and cert_score (if only one exists, that is the component).

5) Title Score:
- 100 if JD title_required appears exactly in candidate_titles (or as headline/title).
- 70 if a close variant (e.g., "Senior X" vs "X Engineer") appears.
- 40 if related/adjacent titles appear.
- 0 otherwise.

6) ATS Formatting Score:
- Map ats_parseability: "ok" -> 100, "warning" -> 60, "error" -> 20.
- If file_format is not a standard text format (pdf/docx/txt) mark a small penalty: subtract 10 points (but do not go below 0).
- Component = mapped value (after penalties).

7) Quantifying & Action-Verbs Score:
- quantified_ratio = bullets_quantified / max(bullets_total,1).
- quantified_score = quantified_ratio * 100.
- action_verb_ratio = min(action_verb_count / 12, 1).
- action_verb_score = action_verb_ratio * 100.
- component = round( 0.7 * quantified_score + 0.3 * action_verb_score ).

8) Soft Skills Score:
- If JD lists soft_skills_requested:
  component = (matched_soft_count / total_soft_requested) * 100.
- Else component = 100.

Combine:
match_rate_raw = (
  must_have_component * 0.35 +
  preferred_component * 0.10 +
  experience_component * 0.20 +
  education_component * 0.10 +
  title_component * 0.05 +
  ats_component * 0.05 +
  quant_action_component * 0.08 +
  soft_component * 0.07
)

Final adjustments (hard rules):
- If total_must_count > 0 and (matched_must_count / total_must_count) < 0.5, then cap match_rate_raw to a maximum of 55.
- If total_must_count > 0 and matched_must_count == 0, then set match_rate_raw = min(match_rate_raw, 40).
- If candidate clearly fails a stated minimum (e.g., required_years_experience > total_years_experience by more than 50%, or a required certification/education explicitly missing), reduce match_rate_raw by 10 (floor 0).
- Final match_rate = round(clamp(match_rate_raw, 0, 100)).

--- OUTPUT JSON SCHEMA (return THIS EXACT OBJECT) ---
{
  "match_rate": integer,                      // 0-100, final score
  "breakdown": {                              // component details (each 0-100 int)
    "must_have_skills_component": integer,
    "preferred_skills_component": integer,
    "experience_component": integer,
    "education_component": integer,
    "title_component": integer,
    "ats_formatting_component": integer,
    "quant_action_component": integer,
    "soft_component": integer,
    "adjustments_applied": [                   // list of short strings describing any final caps/penalties applied
      "string", ...
    ]
  },
  "content": {                                // same semantics as before
    "ats_parse_rate": { "status": "ok|warning|error", "message": "string" },
    "quantifying_impact": { "status": "ok|warning|error", "message": "string", "bullets_total": integer, "bullets_quantified": integer },
    "repetition": { "status": "ok|warning|error", "message": "string", "top_repeated_terms": ["string", ...] },
    "spelling_grammar": { "status": "ok|warning|error", "message": "string", "issues_found": integer }
  },
  "sections": {
    "essential_sections": {
      "Experience": { "status": "present|not_present", "message": "string" },
      "Education": { "status": "present|not_present", "message": "string" },
      "Skills": { "status": "present|not_present", "message": "string" }
    },
    "contact_information": {
      "Email": { "status": "present|not_present", "message": "string" },
      "Phone": { "status": "present|not_present", "message": "string" },
      "Address": { "status": "present|not_present", "message": "string" },
      "LinkedIn/Portfolio": { "status": "present|not_present", "message": "string" }
    }
  },
  "ats_essentials": {
    "file_format_size": { "status": "ok|warning|error", "message": "string", "file_format": "string", "file_size_mb": number|null },
    "design": { "status": "ok|warning|error", "message": "string" },
    "email_address": { "status": "ok|not_present|invalid", "message": "string" },
    "header_links": { "status": "ok|warning|not_present", "message": "string" }
  },
  "tailoring": {
    "hard_skills": [ { "skill": "string", "resume_count": integer, "job_description_count": integer, "message": "string" }, ... ],
    "soft_skills": [ { "skill": "string", "resume_count": integer, "job_description_count": integer, "message": "string" }, ... ],
    "action_verbs": { "count": integer, "message": "string" },
    "tailored_title": { "status": "ok|error", "message": "string" }
  },
  "suggestions": [ "string", ... ]            // prioritized (most impactful first)
}

--- ADDITIONAL GUIDELINES ---
- Be conservative and literal: prefer under-estimating fit rather than inflating.
- Use synonyms and fuzzy matching for skills/titles but prefer exact matches when present.
- When counting occurrences, count distinct mentions across experience bullets, skills lists, and summaries.
- In "message" fields include short evidence phrases (e.g., "3/5 must-have skills matched: React(yes), Node(no), SQL(yes)").
- If any field required by the schema cannot be determined, fill with sensible defaults (e.g., counts = 0, status = "not_present").
- Output MUST be valid JSON parsable by standard JSON.parse.

Now perform the analysis and return the JSON object only.
`;

    const analysisText = await callDeepSeek(prompt, apiKey);

    let analysis;
    try {
      const jsonStart = analysisText.indexOf('{');
      const jsonEnd = analysisText.lastIndexOf('}') + 1;
      if (jsonStart === -1 || jsonEnd === 0) throw new Error('No JSON found');
      const jsonString = analysisText.slice(jsonStart, jsonEnd);
      analysis = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      throw new Error('Invalid response from AI');
    }

    return analysis;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

export const autofillFromResume = async (file: File, apiKey: string): Promise<ResumeData> => {
  try {
    if (!apiKey.trim()) {
      throw new Error('Please provide an API key.');
    }

    const resumeText = await extractTextFromPDF(file);
    const schema = ResumeSchema.toJSONSchema();

const prompt = `
You are a system that extracts structured resume data.

TASK:
Given the Resume text below, produce a VALID JSON object that STRICTLY matches the ResumeData schema.

CRITICAL RULES (must follow all):
- Output ONLY raw JSON (no markdown, no comments, no explanation).
- The top-level output MUST be a single JSON object.
- ALL required fields MUST exist.
- Use empty strings "" for missing string values.
- Use empty arrays [] for missing array values.
- NEVER use null or undefined.
- Array fields MUST always be arrays, even if only one item exists.
- Object items inside arrays MUST contain ALL their required fields.
- Do NOT infer information that is not supported by the Resume text.
- Keep bullet points concise and factual.
- Preserve original wording when possible.

SCHEMA (for reference, not to be reprinted):
${JSON.stringify(schema, null, 2)}

RESUME TEXT:
"""
${resumeText}
"""

OUTPUT:
Return ONLY the JSON object that conforms exactly to the schema.
`;

    const responseText = await callDeepSeek(prompt, apiKey);

    let resumeData;
    try {
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      if (jsonStart === -1 || jsonEnd === 0) throw new Error('No JSON found');
      const jsonString = responseText.slice(jsonStart, jsonEnd);
      resumeData = JSON.parse(jsonString);
      const parsed = ResumeSchema.safeParse(resumeData);

      if (!parsed.success) {
        throw new Error("AI returned invalid Resume structure");
      }

      return parsed.data;
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      throw new Error('Invalid response from AI');
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

const callDeepSeek = async (prompt: string, apiKey: string) => {
  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
}

const getResumeTextFromData = (resumeData: ResumeData): string => {
  const header = [
    resumeData.name,
    resumeData.title,
    resumeData.phone,
    resumeData.email,
    resumeData.location,
    resumeData.nationality,
    resumeData.extraField,
  ]
    .filter(Boolean)
    .join("\n");

  let text = `${header}\n\n`;

  text += `Summary\n${resumeData.summary}\n\n`;

  resumeData.sections.forEach(section => {
    text += sectionToText(section);
  });

  return text.trim();
}