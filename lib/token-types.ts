export type HostSummary = {
  host: string;
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
