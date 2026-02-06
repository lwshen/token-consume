export type HostSummary = {
  id: string;
  name?: string;
  entries: number;
  prompt: number;
  completion: number;
  quota: number;
  cost: number;
  useTime: number;
  latest: number;
  errors: string[];
};

export type TokenSummary = {
  overall: {
    hosts: number;
    entries: number;
    prompt: number;
    completion: number;
    quota: number;
    cost: number;
    useTime: number;
    latest: number;
  };
  hosts: HostSummary[];
};

export type TokenSummaryResponse =
  | { success: true; data: TokenSummary }
  | { success: false; message: string };

export type DateRangePreset = "all" | "24h" | "7d" | "30d" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export const isValidPreset = (value: string | null): value is DateRangePreset => {
  return value === "all" || value === "24h" || value === "7d" || value === "30d" || value === "custom";
};
