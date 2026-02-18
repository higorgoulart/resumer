import React from "react";
import type { ResumeData } from "../types";
import Resume from "./Resume";

interface ResumeDisplayProps {
  resumeData: ResumeData;
}

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumeData }) => {
  const handlePrint = () => {
    const originalResume = document.getElementById('resume');
    if (!originalResume) return;

    const clone = originalResume.cloneNode(true) as HTMLElement;
    clone.classList.add('print-only');

    const root = document.querySelector('.app-root');
    root?.classList.add('printing-hidden');

    document.body.appendChild(clone);
    window.print();
    document.body.removeChild(clone);
    root?.classList.remove('printing-hidden');
  };

  return (
    <main className="col-span-12 lg:col-span-6 bg-base-100 rounded-xl shadow p-4 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Preview</h2>
        <button onClick={handlePrint} className="btn btn-sm btn-primary">
          Download PDF
        </button>
      </div>
      <div className="flex-1 overflow-y-auto rounded-lg bg-base-200 p-4">
        <Resume data={resumeData} />
      </div>
    </main>
  );
};

export default ResumeDisplay;
