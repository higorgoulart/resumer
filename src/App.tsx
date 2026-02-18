import React, { useEffect, useState } from 'react';
import ResumeDisplay from './components/ResumeDisplay';
import ResumeForm from './components/ResumeForm';
import ResultDisplay from './components/ResultDisplay';
import { ResumeSchema, defaultResume, type ResumeData } from './types';
import { useApiKey } from "./hooks/useApiKey";

const STORAGE_KEY = 'ATS_ANALYZER_RESUME_DATA';

function App() {
  const { apiKey, setApiKey } = useApiKey();

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const [error, setError] = useState('');

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return ResumeSchema.parse(JSON.parse(saved));
      } catch {
        return defaultResume;
      }
    }
    return defaultResume;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
  }, [resumeData]);

  return (
    <div className="app-root min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow px-6">
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            ATS Resume Analyzer <span className="text-primary">with AI</span>
          </h1>
        </div>
        <button 
          className="btn btn-lg btn-circle btn-ghost"
          onClick={() =>
            (document.getElementById('config-modal') as HTMLDialogElement).showModal()
          }
        >
          <img src="/options.svg" className="size-6" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-64px)]">
        <ResumeForm resumeData={resumeData} apiKey={apiKey} onChange={setResumeData} setError={setError} />
        <ResumeDisplay resumeData={resumeData} />
        <ResultDisplay resumeData={resumeData} apiKey={apiKey} setError={setError} />
      </div>

      {error && (
        <div role="alert" className="alert alert-error absolute top-4 right-4 z-50">
          <span>{error}</span>
          <button
            className="btn btn-xs btn-circle btn-ghost"
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      <dialog id="config-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Configuration</h3>
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="sk-xxxxxxxx"
            value={apiKey}
            onChange={handleApiKeyChange}
          />
          <p className="text-xs opacity-70 mt-2">
            Stored locally. Only used for API calls.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default App;
