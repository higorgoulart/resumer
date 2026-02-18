import { useState } from "react";
import { analyzeResume } from "../services/ats.service";
import type { ResumeData } from "../types";

interface ResultDisplayProps {
	resumeData: ResumeData;
	apiKey: string;
	setError: (error: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ resumeData, apiKey, setError }) => {
	const [jobDescription, setJobDescription] = useState('');
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeResume(resumeData, jobDescription, apiKey);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderItemGroup = (items: Record<string, any>) => (
    <div className="space-y-2 text-sm">
      {Object.entries(items).map(([key, item]) => (
        <div key={key} className="flex gap-2">
          <StatusIcon status={item.status} />
          <span>
            <strong>{key.replace(/_/g, ' ')}:</strong> {item.message}
          </span>
        </div>
      ))}
    </div>
  );

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs opacity-70">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <progress
        className="progress progress-primary w-full"
        value={value}
        max={100}
      />
    </div>
  );

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <span className="text-success">✔</span>;
    if (status === 'warning') return <span className="text-warning">⚠</span>;
    if (status === 'error') return <span className="text-error">✖</span>;
    return null;
  };

	return (
		<aside className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto">
			<div className="bg-base-100 rounded-xl shadow p-4">
				<h2 className="font-semibold mb-2">Job Description</h2>
				<form onSubmit={handleSubmit}>
					<textarea
						className="textarea textarea-bordered w-full h-32"
						value={jobDescription}
						onChange={e => setJobDescription(e.target.value)}
						placeholder="Paste job description..."
					/>
					<button
						type="submit"
						disabled={loading}
						className="btn btn-primary btn-block mt-3"
					>
						{loading ? 'Analyzing…' : 'Analyze Resume'}
					</button>
				</form>
			</div>

			{result && (
				<div className="bg-base-100 rounded-xl shadow p-4 space-y-6">
					{/* Overall Score */}
					<div className="text-center">
						<div className="text-sm opacity-70">ATS Match Score</div>
						<div
							className={`text-4xl font-bold ${
								result.match_rate >= 80
									? 'text-success'
									: result.match_rate >= 60
									? 'text-warning'
									: 'text-error'
							}`}
						>
							{result.match_rate}%
						</div>
						{result.breakdown?.adjustments_applied?.length > 0 && (
							<div className="text-xs text-warning mt-1">
								Caps / penalties applied
							</div>
						)}
					</div>

					{result.breakdown && (
						<div className="space-y-3">
							<h3 className="font-semibold text-sm">Score Breakdown</h3>
							<ScoreBar label="Must-have skills" value={result.breakdown.must_have_skills_component} />
							<ScoreBar label="Preferred skills" value={result.breakdown.preferred_skills_component} />
							<ScoreBar label="Experience" value={result.breakdown.experience_component} />
							<ScoreBar label="Education & certs" value={result.breakdown.education_component} />
							<ScoreBar label="Job title match" value={result.breakdown.title_component} />
							<ScoreBar label="ATS formatting" value={result.breakdown.ats_formatting_component} />
							<ScoreBar label="Impact & action verbs" value={result.breakdown.quant_action_component} />
							<ScoreBar label="Soft skills" value={result.breakdown.soft_component} />
						</div>
					)}

					{result.content && (
						<div className="space-y-2">
							<h3 className="font-semibold text-sm">Resume Quality Checks</h3>
							{renderItemGroup(result.content)}
						</div>
					)}

					{result.ats_essentials && (
						<div className="space-y-2">
							<h3 className="font-semibold text-sm">ATS Compatibility</h3>
							{renderItemGroup(result.ats_essentials)}
						</div>
					)}

					{result.suggestions?.length > 0 && (
						<div className="space-y-2">
							<h3 className="font-semibold text-sm">Top Improvement Suggestions</h3>
							<ul className="list-disc list-inside text-sm space-y-1">
								{result.suggestions.map((s: string, i: number) => (
									<li key={i}>{s}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</aside>
	)
};

export default ResultDisplay;