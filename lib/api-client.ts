import { getAuthToken } from "./auth-client";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true
  headers?: Record<string, string>;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, auth = true, headers = {} } = options;
  const h: Record<string, string> = { ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (auth) {
    const token = getAuthToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) {
    throw new ApiError(
      data?.error ?? `Request failed (${res.status})`,
      res.status,
      data
    );
  }
  if (data && data.success === false) {
    throw new ApiError(data.error ?? "Request failed", res.status, data);
  }
  return data as T;
}
