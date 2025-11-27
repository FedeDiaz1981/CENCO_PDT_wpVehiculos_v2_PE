// proveedoresCatalog.ts

import { SP } from "../../../pnp"; // ajustá la ruta según tu estructura

export type ProveedorInfo = {
  id: number;         // ID en la lista Proveedores
  title: string;      // Title (razón social)
  ruc: string;        // RUC
  usuarios: string[]; // columna Usuarios (personas autorizadas)
};

export async function getProveedoresCatalogFromList(
  listName = "Proveedores"
): Promise<ProveedorInfo[]> {
  const items: any[] = await SP()
    .web.lists
    .getByTitle(listName)
    .items
    .select("Id", "Title", "RUC", "Usuarios/Title")
    .expand("Usuarios")();

  return items.map(i => ({
    id: i.Id,
    title: i.Title,
    ruc: i.RUC || "",
    usuarios: Array.isArray(i.Usuarios)
      ? i.Usuarios.map((u: any) => String(u.Title || ""))
      : []
  }));
}
