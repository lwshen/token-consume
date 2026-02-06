import "server-only";
import { readFile } from "fs/promises";
import path from "path";

import type { DateRange, HostSummary, TokenSummary } from "./token-types";

type LocalConfig = {
  HOST: string;
  API_KEY: string;
  NAME?: string;
};

type TokenLogItem = {
  id: number;
  user_id: number;
  created_at: number;
  type: number;
  content: string;
  username: string;
  token_name: string;
  model_name: string;
  quota: number;
  prompt_tokens: number;
  completion_tokens: number;
  use_time: number;
  is_stream: boolean;
  channel: number;
  channel_name: string;
  token_id: number;
  group: string;
  ip: string;
  other: string;
};

type TokenLogResponse = {
  data?: TokenLogItem[];
  message?: string;
  success?: boolean;
};

const normalizeHost = (host: string) => host.trim().replace(/\/+$/, "");

const loadConfigs = async (): Promise<LocalConfig[]> => {
  const configPath = path.join(process.cwd(), "config.json");
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error(
      "config.json must be an array of entries with HOST and API_KEY."
    );
  }

  if (parsed.length === 0) {
    throw new Error("config.json must contain at least one entry.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(
        `config.json entry ${index + 1} must be an object with HOST and API_KEY.`
      );
    }

    const host = (entry as Partial<LocalConfig>).HOST;
    const apiKey = (entry as Partial<LocalConfig>).API_KEY;
    const name = (entry as Partial<LocalConfig>).NAME;

    if (typeof host !== "string" || typeof apiKey !== "string") {
      throw new Error(
        `config.json entry ${index + 1} must include HOST and API_KEY strings.`
      );
    }

    return {
      HOST: normalizeHost(host),
      API_KEY: apiKey,
      NAME: typeof name === "string" && name.trim() ? name.trim() : undefined,
    };
  });
};

const fetchTokenLogs = async (config: LocalConfig) => {
  const url = new URL("/api/log/token", config.HOST);
  url.searchParams.set("key", config.API_KEY);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as TokenLogResponse;
  if (payload.success === false) {
    throw new Error(payload.message || "API returned success=false.");
  }

  return payload;
};

const addItemToSummary = (summary: Omit<HostSummary, "id">, item: TokenLogItem) => {
  summary.entries += 1;
  summary.prompt += item.prompt_tokens || 0;
  summary.completion += item.completion_tokens || 0;
  summary.quota += item.quota || 0;
  summary.useTime += item.use_time || 0;
  if (item.created_at && item.created_at > summary.latest) {
    summary.latest = item.created_at;
  }
};

const parseDateRange = (
  dateRange?: DateRange
): { startTimestamp?: number; endTimestamp?: number } => {
  if (!dateRange) {
    return {};
  }

  const now = Math.floor(Date.now() / 1000);
  let startTimestamp: number | undefined;
  let endTimestamp: number | undefined;

  switch (dateRange.preset) {
    case "all":
      break;
    case "24h":
      startTimestamp = now - 24 * 60 * 60;
      break;
    case "7d":
      startTimestamp = now - 7 * 24 * 60 * 60;
      break;
    case "30d":
      startTimestamp = now - 30 * 24 * 60 * 60;
      break;
    case "custom":
      if (dateRange.startDate) {
        startTimestamp = Math.floor(
          new Date(dateRange.startDate).getTime() / 1000
        );
      }
      if (dateRange.endDate) {
        endTimestamp = Math.floor(
          new Date(dateRange.endDate).getTime() / 1000
        );
        endTimestamp += 24 * 60 * 60 - 1;
      }
      break;
  }

  return { startTimestamp, endTimestamp };
};

const computeCost = (quota: number) => (quota / 1_000_000) * 2;

const validateDateRange = (dateRange?: DateRange): string | null => {
  if (!dateRange || dateRange.preset !== "custom") {
    return null;
  }
  if (dateRange.startDate && dateRange.endDate) {
    if (dateRange.startDate > dateRange.endDate) {
      return "Start date must be before or equal to end date";
    }
  }
  return null;
};

const buildSummary = (
  configs: LocalConfig[],
  results: PromiseSettledResult<TokenLogResponse>[],
  dateRange?: DateRange
) => {
  const { startTimestamp, endTimestamp } = parseDateRange(dateRange);
  const groups = new Map<string, Omit<HostSummary, "id">>();

  configs.forEach((config, index) => {
    const existing = groups.get(config.HOST) ?? {
      name: config.NAME,
      entries: 0,
      prompt: 0,
      completion: 0,
      quota: 0,
      cost: 0,
      useTime: 0,
      latest: 0,
      errors: [],
    };

    if (!existing.name && config.NAME) {
      existing.name = config.NAME;
    }

    const result = results[index];
    if (result.status === "fulfilled") {
      const items = Array.isArray(result.value.data) ? result.value.data : [];
      items.forEach((item) => {
        if (startTimestamp && item.created_at < startTimestamp) {
          return;
        }
        if (endTimestamp && item.created_at > endTimestamp) {
          return;
        }
        addItemToSummary(existing, item);
      });
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown error";
      existing.errors.push(message);
    }

    groups.set(config.HOST, existing);
  });

  const hosts = Array.from(groups.values()).map((host, index) => ({
    ...host,
    id: `host-${index + 1}`,
    cost: computeCost(host.quota),
  }));

  const overall = hosts.reduce(
    (acc, host) => {
      acc.entries += host.entries;
      acc.prompt += host.prompt;
      acc.completion += host.completion;
      acc.quota += host.quota;
      acc.useTime += host.useTime;
      if (host.latest > acc.latest) {
        acc.latest = host.latest;
      }
      return acc;
    },
    {
      hosts: hosts.length,
      entries: 0,
      prompt: 0,
      completion: 0,
      quota: 0,
      cost: 0,
      useTime: 0,
      latest: 0,
    }
  );

  overall.cost = computeCost(overall.quota);

  return { overall, hosts } satisfies TokenSummary;
};

export const getTokenSummary = async (
  dateRange?: DateRange
): Promise<
  | { ok: true; data: TokenSummary }
  | { ok: false; error: string }
> => {
  const validationError = validateDateRange(dateRange);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  try {
    const configs = await loadConfigs();
    const results = await Promise.allSettled(
      configs.map((config) => fetchTokenLogs(config))
    );
    return { ok: true, data: buildSummary(configs, results, dateRange) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
