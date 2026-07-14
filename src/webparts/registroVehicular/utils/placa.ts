export type PlacaPattern = {
  left: number;
  right: number;
};

const PLACA_PATTERN_RE = /^\s*\[?(\d+)\]?\s*-\s*\[?(\d+)\]?\s*$/;

const sanitizeRawPlaca = (value: unknown): string =>
  String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-");

export function parsePlacaPattern(value: string | undefined): PlacaPattern | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  const match = raw.match(PLACA_PATTERN_RE);
  if (!match) return undefined;

  const left = Number(match[1]);
  const right = Number(match[2]);

  if (!Number.isFinite(left) || !Number.isFinite(right) || left <= 0 || right <= 0) {
    return undefined;
  }

  return { left, right };
}

export function normalizePlacaValue(value: unknown, pattern?: PlacaPattern): string {
  const cleaned = sanitizeRawPlaca(value);
  if (!pattern) return cleaned;

  const total = pattern.left + pattern.right;
  const alnum = cleaned.replace(/-/g, "").slice(0, total);
  const hyphenIndex = cleaned.indexOf("-");

  if (hyphenIndex < 0) {
    return alnum;
  }

  const left = alnum.slice(0, pattern.left);
  const right = alnum.slice(pattern.left, total);
  return `${left}-${right}`.replace(/-$/, "");
}

export function isPlacaValid(value: unknown, pattern?: PlacaPattern): boolean {
  const cleaned = sanitizeRawPlaca(value);
  if (!cleaned) return false;
  if (!pattern) return cleaned.length > 0;

  const total = pattern.left + pattern.right;
  const alnum = cleaned.replace(/-/g, "");

  if (cleaned.includes("-")) {
    if (cleaned.indexOf("-") !== cleaned.lastIndexOf("-")) return false;

    const [left = "", right = ""] = cleaned.split("-");
    if (!left || !right) return false;

    return left.length === pattern.left && right.length === pattern.right && alnum.length === total;
  }

  return alnum.length === total;
}

