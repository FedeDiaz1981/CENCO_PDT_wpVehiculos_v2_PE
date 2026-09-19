export type PlacaPattern = {
  groups: number[];
  separators: string[];
  mask: string;
  left: number;
  right: number;
};

export function parsePlacaPattern(value: string | undefined): PlacaPattern | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  const tokenRe = /\[(\d+)\]|(\d+)/g;
  const groups: number[] = [];
  const separators: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(raw)) !== null) {
    const separator = raw.slice(cursor, match.index);
    if (groups.length > 0) separators.push(separator);
    else if (separator.trim()) return undefined;

    const size = Number(match[1] || match[2]);
    if (!Number.isFinite(size) || size <= 0) return undefined;

    groups.push(size);
    cursor = match.index + match[0].length;
  }

  if (!groups.length || raw.slice(cursor).trim()) return undefined;

  const mask = groups
    .map((size, index) => `${"_".repeat(size)}${separators[index] || ""}`)
    .join("");

  return { groups, separators, mask, left: groups[0], right: groups[1] || 0 };
}

const alphanumericOnly = (value: unknown): string =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export function normalizePlacaValue(value: unknown, pattern?: PlacaPattern): string {
  const alphanumeric = alphanumericOnly(value);
  if (!pattern) return alphanumeric;

  let cursor = 0;
  return pattern.groups
    .map((size, index) => {
      const chunk = alphanumeric.slice(cursor, cursor + size);
      cursor += size;
      const separator = pattern.separators[index] || "";
      return `${chunk}${chunk.length === size && index < pattern.groups.length - 1 ? separator : ""}`;
    })
    .join("");
}

export function isPlacaValid(value: unknown, pattern?: PlacaPattern): boolean {
  const alphanumeric = alphanumericOnly(value);
  if (!alphanumeric) return false;
  if (!pattern) return true;

  const expectedLength = pattern.groups.reduce((total, size) => total + size, 0);
  return alphanumeric.length === expectedLength;
}
