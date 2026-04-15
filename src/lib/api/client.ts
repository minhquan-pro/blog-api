const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const d = data as { error?: string; hint?: string; detail?: string };
    const msg =
      typeof d?.error === "string"
        ? [d.error, d.hint].filter(Boolean).join(" — ")
        : res.statusText;
    throw new Error(msg);
  }

  return data as T;
}
