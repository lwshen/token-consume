"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import type { DateRange, DateRangePreset, HostSummary, TokenSummary, TokenSummaryResponse } from "@/lib/token-types";
import DateRangePicker from "./DateRangePicker";

type TokenDashboardProps = {
  initialData?: TokenSummary | null;
  initialError?: string | null;
  initialDateRange?: DateRange;
};

const isValidPreset = (value: string | null): value is DateRangePreset => {
  return value === "all" || value === "24h" || value === "7d" || value === "30d" || value === "custom";
};

const getDefaultDateRange = (): DateRange => ({
  preset: "30d",
});

const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "—";

const formatTimestamp = (value?: number) => {
  if (!value) return "—";
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatCost = (value?: number) => {
  if (typeof value !== "number") return "—";
  return "$" + value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const emptySummary: TokenSummary = {
  overall: {
    hosts: 0,
    entries: 0,
    prompt: 0,
    completion: 0,
    quota: 0,
    cost: 0,
    useTime: 0,
    latest: 0,
  },
  hosts: [],
};

const extractError = (payload: TokenSummaryResponse | null) => {
  if (!payload) return "Unexpected response.";
  if (payload.success) return "Unexpected response.";
  return payload.message || "Unexpected response.";
};

const HostCard = ({ host }: { host: HostSummary }) => (
  <div className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-xl shadow-slate-200/40">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {host.name || "Host"}
        </h2>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Entries</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(host.entries)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Prompt</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(host.prompt)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Completion</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(host.completion)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Quota</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(host.quota)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cost</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatCost(host.cost)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Use Time</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatNumber(host.useTime)}s
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Last Used</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatTimestamp(host.latest)}
          </p>
        </div>
      </div>
    </div>

    {host.errors.length > 0 ? (
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">Host errors</p>
        <ul className="mt-2 list-disc pl-5">
          {host.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    ) : null}

    {host.entries === 0 ? (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-6 text-sm text-slate-500">
        No entries returned for this host.
      </div>
    ) : null}
  </div>
);

export default function TokenDashboard({
  initialData,
  initialError,
  initialDateRange,
}: TokenDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<TokenSummary | null>(initialData ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError ?? null
  );
  const [isPending, startTransition] = useTransition();

  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange ?? getDefaultDateRange()
  );

  const overall = data?.overall ?? emptySummary.overall;
  const hosts = data?.hosts ?? emptySummary.hosts;

  const updateUrlParams = useCallback(
    (newDateRange: DateRange) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("preset", newDateRange.preset);

      if (newDateRange.preset === "custom") {
        if (newDateRange.startDate) {
          params.set("startDate", newDateRange.startDate);
        } else {
          params.delete("startDate");
        }
        if (newDateRange.endDate) {
          params.set("endDate", newDateRange.endDate);
        } else {
          params.delete("endDate");
        }
      } else {
        params.delete("startDate");
        params.delete("endDate");
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const fetchData = useCallback(
    async (range: DateRange) => {
      startTransition(async () => {
        setErrorMessage(null);
        let payload: TokenSummaryResponse | null = null;

        try {
          const params = new URLSearchParams();
          params.set("preset", range.preset);
          if (range.preset === "custom") {
            if (range.startDate) params.set("startDate", range.startDate);
            if (range.endDate) params.set("endDate", range.endDate);
          }

          const response = await fetch(`/api/token-consume?${params.toString()}`, {
            cache: "no-store",
          });
          payload = (await response.json()) as TokenSummaryResponse;

          if (!response.ok || !payload.success) {
            setErrorMessage(extractError(payload));
            return;
          }

          setData(payload.data);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to refresh data."
          );
        }
      });
    },
    []
  );

  const handleDateRangeChange = useCallback(
    (newDateRange: DateRange) => {
      setDateRange(newDateRange);
      updateUrlParams(newDateRange);
      fetchData(newDateRange);
    },
    [fetchData, updateUrlParams]
  );

  const handleRefresh = () => {
    fetchData(dateRange);
  };

  useEffect(() => {
    const presetParam = searchParams.get("preset");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (presetParam) {
      const preset = isValidPreset(presetParam) ? presetParam : "30d";
      const newDateRange: DateRange = {
        preset,
        ...(preset === "custom" && {
          startDate: startDateParam ?? undefined,
          endDate: endDateParam ?? undefined,
        }),
      };
      setDateRange(newDateRange);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ecfeff_38%,_#eef2ff_75%)] text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/60 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm shadow-slate-100/60">
              Token Consume Monitor
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
              />
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isPending}
                className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm shadow-slate-100/60 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-busy={isPending}
              >
                {isPending ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Aggregated token usage by host
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              Reads a local <span className="font-semibold">config.json</span> list and
              fetches token usage from every configured host. Results are aggregated per
              host so you can compare usage in one place.
            </p>
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40">
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-7">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Hosts</p>
              <p className="font-medium text-slate-800">{overall.hosts}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Entries</p>
              <p className="font-medium text-slate-800">{formatNumber(overall.entries)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prompt Tokens</p>
              <p className="font-medium text-slate-800">
                {formatNumber(overall.prompt)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completion Tokens</p>
              <p className="font-medium text-slate-800">
                {formatNumber(overall.completion)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quota</p>
              <p className="font-medium text-slate-800">
                {formatNumber(overall.quota)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cost</p>
              <p className="font-medium text-slate-800">
                {formatCost(overall.cost)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last Used</p>
              <p className="font-medium text-slate-800">
                {formatTimestamp(overall.latest)}
              </p>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700 shadow-lg shadow-rose-100">
            <h2 className="text-base font-semibold text-rose-800">
              Unable to load token logs
            </h2>
            <p className="mt-2">{errorMessage}</p>
            <p className="mt-3 text-rose-600">
              Confirm that <span className="font-semibold">config.json</span> exists at the
              project root and contains a list of entries with valid
              <span className="font-semibold"> HOST</span> and
              <span className="font-semibold"> API_KEY</span> values.
            </p>
          </section>
        ) : null}

        <section className="flex flex-col gap-8">
          {hosts.length === 0 && !errorMessage ? (
            <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/70 p-10 text-center text-sm text-slate-500">
              No token log entries returned yet.
            </div>
          ) : null}

          {hosts.map((host) => (
            <HostCard key={host.host} host={host} />
          ))}
        </section>
      </main>
    </div>
  );
}
