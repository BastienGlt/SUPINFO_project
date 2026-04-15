/**
 * Wrapper générique pour les appels API backend.
 * Ajoute automatiquement le token si fourni.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string; timeoutMs?: number } = {}
): Promise<T> {
  const { token, timeoutMs = 8000, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) throw { status: res.status, error: text };
    return (text as unknown) as T;
  }

  if (!res.ok) {
    throw { status: res.status, ...(data as object) };
  }

  return data as T;
}
