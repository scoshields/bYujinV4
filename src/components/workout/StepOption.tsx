import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StepOptionProps {
  value: string;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function StepOption({
  value,
  label,
  description,
  onClick,
  disabled
}: StepOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full p-4 text-left border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-500 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{label}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
    </button>
  );
}