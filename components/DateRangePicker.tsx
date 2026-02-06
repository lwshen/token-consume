"use client";

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

const isValidDateRange = (startDate?: string, endDate?: string): boolean => {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
};

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const hasInvalidRange = value.preset === "custom" &&
    !isValidDateRange(value.startDate, value.endDate);

  const handlePresetClick = (preset: DateRangePreset) => {
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
    const newStartDate = e.target.value || undefined;
    // If new start date would be after end date, clear end date
    if (newStartDate && value.endDate && newStartDate > value.endDate) {
      onChange({
        ...value,
        preset: "custom",
        startDate: newStartDate,
        endDate: undefined,
      });
    } else {
      onChange({
        ...value,
        preset: "custom",
        startDate: newStartDate,
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value || undefined;
    // If new end date would be before start date, clear start date
    if (newEndDate && value.startDate && newEndDate < value.startDate) {
      onChange({
        ...value,
        preset: "custom",
        startDate: undefined,
        endDate: newEndDate,
      });
    } else {
      onChange({
        ...value,
        preset: "custom",
        endDate: newEndDate,
      });
    }
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
            max={value.endDate}
            className={`rounded-full border bg-white/80 px-3 py-1.5 text-xs text-slate-700 shadow-sm shadow-slate-100/60 outline-none focus:border-slate-400 ${
              hasInvalidRange
                ? "border-rose-300 focus:border-rose-400"
                : "border-slate-200/70"
            }`}
            placeholder="Start date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={value.endDate || ""}
            onChange={handleEndDateChange}
            min={value.startDate}
            className={`rounded-full border bg-white/80 px-3 py-1.5 text-xs text-slate-700 shadow-sm shadow-slate-100/60 outline-none focus:border-slate-400 ${
              hasInvalidRange
                ? "border-rose-300 focus:border-rose-400"
                : "border-slate-200/70"
            }`}
            placeholder="End date"
          />
          {hasInvalidRange && (
            <span className="text-xs text-rose-500">Invalid range</span>
          )}
        </div>
      )}
    </div>
  );
}
