const stripAccents = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function normalizeTipoUnidad(value: unknown): string {
  return stripAccents(String(value ?? ""))
    .toLowerCase()
    .trim();
}

export function isCamionTipoUnidad(value: unknown): boolean {
  return normalizeTipoUnidad(value) === "camion";
}

export function normalizeCodigoVehicular(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export function isCodigoVehicularValid(value: unknown): boolean {
  const normalized = normalizeCodigoVehicular(value);
  return normalized.length > 0 && normalized === String(value ?? "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
