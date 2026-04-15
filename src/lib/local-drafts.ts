const storageKey = (userId: string) => `blog_local_drafts_${userId}`;

export interface LocalDraft {
  id: string;
  updatedAt: string;
  title: string;
  subtitle: string;
  body: string;
  excerpt: string;
  coverImageUrl: string;
  tagInput: string;
  publicationId: string | null;
}

function readAll(userId: string): LocalDraft[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LocalDraft =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as LocalDraft).id === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(userId: string, drafts: LocalDraft[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(drafts));
}

export function listLocalDrafts(userId: string): LocalDraft[] {
  return readAll(userId).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getLocalDraft(userId: string, id: string): LocalDraft | undefined {
  return readAll(userId).find((d) => d.id === id);
}

export function upsertLocalDraft(userId: string, draft: LocalDraft): void {
  const all = readAll(userId);
  const i = all.findIndex((d) => d.id === draft.id);
  const next = { ...draft, updatedAt: new Date().toISOString() };
  if (i >= 0) {
    all[i] = next;
  } else {
    all.push(next);
  }
  writeAll(userId, all);
}

export function deleteLocalDraft(userId: string, id: string): void {
  writeAll(
    userId,
    readAll(userId).filter((d) => d.id !== id),
  );
}
