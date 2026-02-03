import { NextResponse } from "next/server";

import { getTokenSummary } from "@/lib/token-summary";
import type { TokenSummaryResponse } from "@/lib/token-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getTokenSummary();
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
