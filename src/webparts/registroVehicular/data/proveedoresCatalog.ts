// proveedoresCatalog.ts

import { SP } from "../../../pnp"; // ajustá la ruta según tu estructura

export type ProveedorInfo = {
  id: number;         // ID en la lista Proveedores
  title: string;      // Title (razón social)
  ruc: string;        // RUC
  usuarios: string[]; // nombres de las personas autorizadas
  usuarioIds: number[]; // IDs de la columna persona Usuarios
};

export async function getProveedoresCatalogFromList(
  listName = "Proveedores"
): Promise<ProveedorInfo[]> {
  const items: any[] = await SP()
    .web.lists
    .getByTitle(listName)
    .items
    .select("Id", "Title", "RUC", "Usuarios/Id", "Usuarios/Title")
    .expand("Usuarios")();

  return items.map(i => {
    const usuarios = Array.isArray(i.Usuarios)
      ? i.Usuarios
      : i.Usuarios
      ? [i.Usuarios]
      : [];

    return {
    id: i.Id,
    title: i.Title,
    ruc: i.RUC || "",
    usuarios: usuarios.map((u: any) => String(u.Title || "")),
    usuarioIds: usuarios
      .map((u: any) => Number(u.Id))
      .filter((id: number) => Number.isFinite(id) && id > 0),
    };
  });
}
