"use client";

import { useState } from "react";

import type { DateRange, DateRangePreset } from "@/lib/token-types";

type DateRangePickerProps = {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
};

const presets: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(value.preset === "custom");

  const handlePresetClick = (preset: DateRangePreset) => {
    setIsCustomOpen(preset === "custom");
    if (preset === "custom") {
      onChange({
        preset,
        startDate: value.startDate,
        endDate: value.endDate,
      });
    } else {
      onChange({ preset });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      preset: "custom",
      startDate: e.target.value || undefined,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      preset: "custom",
      endDate: e.target.value || undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 p-1 shadow-sm shadow-slate-100/60">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              value.preset === preset.value
                ? "bg-slate-800 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {value.preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.startDate || ""}
            onChange={handleStartDateChange}
            className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs text-slate-700 shadow-sm shadow-slate-100/60 outline-none focus:border-slate-400"
            placeholder="Start date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={value.endDate || ""}
            onChange={handleEndDateChange}
            className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs text-slate-700 shadow-sm shadow-slate-100/60 outline-none focus:border-slate-400"
            placeholder="End date"
          />
        </div>
      )}
    </div>
  );
}
