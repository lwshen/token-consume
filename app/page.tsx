import TokenDashboard from "@/components/TokenDashboard";
import { getTokenSummary } from "@/lib/token-summary";
import type { DateRange, DateRangePreset } from "@/lib/token-types";

export const dynamic = "force-dynamic";

const isValidPreset = (value: string | null): value is DateRangePreset => {
  return value === "all" || value === "24h" || value === "7d" || value === "30d" || value === "custom";
};

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const presetParam = typeof params.preset === "string" ? params.preset : null;
  const preset: DateRangePreset = isValidPreset(presetParam) ? presetParam : "30d";

  const startDate = typeof params.startDate === "string" ? params.startDate : undefined;
  const endDate = typeof params.endDate === "string" ? params.endDate : undefined;

  const dateRange: DateRange = {
    preset,
    ...(preset === "custom" && { startDate, endDate }),
  };

  const result = await getTokenSummary(dateRange);

  return (
    <TokenDashboard
      initialData={result.ok ? result.data : null}
      initialError={result.ok ? null : result.error}
      initialDateRange={dateRange}
    />
  );
}
