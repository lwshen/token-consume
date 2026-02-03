import TokenDashboard from "@/components/TokenDashboard";
import { getTokenSummary } from "@/lib/token-summary";

export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await getTokenSummary();

  return (
    <TokenDashboard
      initialData={result.ok ? result.data : null}
      initialError={result.ok ? null : result.error}
    />
  );
}
