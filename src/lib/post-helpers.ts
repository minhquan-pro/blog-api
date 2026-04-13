export function readingTimeMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function baseSlugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "bai-viet"
  );
}

import { randomUUID } from "node:crypto";

export function uniquePostSlug(base: string): string {
  const suffix = randomUUID().slice(0, 8);
  return `${base}-${suffix}`;
}
