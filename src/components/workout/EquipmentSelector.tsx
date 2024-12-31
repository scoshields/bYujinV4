import React from 'react';

interface EquipmentOption {
  value: string;
  label: string;
}

interface EquipmentSelectorProps {
  options: EquipmentOption[];
  selectedEquipment: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export default function EquipmentSelector({
  options,
  selectedEquipment,
  onSelect,
  disabled
}: EquipmentSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-4">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-start p-4 border rounded-lg hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
        >
          <input
            type="checkbox"
            checked={selectedEquipment.includes(option.value)}
            onChange={() => onSelect(option.value)}
            disabled={disabled}
            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{option.label}</h3>
          </div>
        </label>
      ))}
    </div>
  );
}