/**
 * Wrapper générique pour les appels à l'API RAWG.
 * La clé API est injectée automatiquement via EXPO_PUBLIC_RAWG_API_KEY.
 */
const RAWG_BASE = 'https://api.rawg.io/api';

export async function rawgFetch<T = unknown>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const key = process.env.EXPO_PUBLIC_RAWG_API_KEY ?? '';
  const query = new URLSearchParams({
    key,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(`${RAWG_BASE}${path}?${query}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data as T;
}
