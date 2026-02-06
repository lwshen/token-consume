import TokenDashboard from "@/components/TokenDashboard";
import { getTokenSummary } from "@/lib/token-summary";
import type { DateRange, DateRangePreset } from "@/lib/token-types";
import { isValidPreset } from "@/lib/token-types";

export const dynamic = "force-dynamic";

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
    />
  );
}
