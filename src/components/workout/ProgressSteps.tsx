import React from 'react';

interface ProgressStepsProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressSteps({ totalSteps, currentStep }: ProgressStepsProps) {
  return (
    <div className="flex justify-between mb-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 flex-1 mx-1 rounded ${
            index <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}