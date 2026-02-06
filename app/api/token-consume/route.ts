import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getTokenSummary } from "@/lib/token-summary";
import type { DateRange, DateRangePreset, TokenSummaryResponse } from "@/lib/token-types";
import { isValidPreset } from "@/lib/token-types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const presetParam = searchParams.get("preset");
  const preset: DateRangePreset = isValidPreset(presetParam) ? presetParam : "30d";

  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const dateRange: DateRange = {
    preset,
    ...(preset === "custom" && { startDate, endDate }),
  };

  const result = await getTokenSummary(dateRange);

  if (!result.ok) {
    const payload: TokenSummaryResponse = {
      success: false,
      message: result.error,
    };
    return NextResponse.json(payload, { status: 500 });
  }

  const payload: TokenSummaryResponse = {
    success: true,
    data: result.data,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
