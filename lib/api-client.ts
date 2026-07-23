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
  /** Kept for call-site compatibility; session is always cookie-based. */
  auth?: boolean;
  headers?: Record<string, string>;
};

/**
 * Same-origin fetch that always sends cookies (httpOnly session).
 * Does not read JWT from localStorage or set Authorization Bearer.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const h: Record<string, string> = { ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers: h,
    credentials: "same-origin",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
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
