import { ReactNode } from 'react';

interface ProcessingSectionProps {
  children: ReactNode;
}

export default function ProcessingSection({
  children,
}: ProcessingSectionProps) {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-yellow-500 via-amber-600 to-amber-700 p-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Idea Refinement</h1>
          <p className="text-yellow-100">AI-powered hypothesis generation and validation</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
