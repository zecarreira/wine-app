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

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  const errorMessage = (fallback: string): string => {
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
    return fallback;
  };

  if (!res.ok) {
    throw new ApiError(
      errorMessage(`Request failed (${res.status})`),
      res.status,
      data
    );
  }
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    (data as { success: unknown }).success === false
  ) {
    throw new ApiError(errorMessage("Request failed"), res.status, data);
  }
  return data as T;
}
