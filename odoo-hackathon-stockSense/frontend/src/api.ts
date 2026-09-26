const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
