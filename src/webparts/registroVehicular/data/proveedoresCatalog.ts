export type ProveedorInfo = {
  id: number;         // ID en la lista Proveedores
  title: string;      // Title (razón social)
  ruc: string;        // RUC
  usuarios: string[]; // columna Usuarios (personas autorizadas)
};

export const PROVEEDORES_CATALOG: ProveedorInfo[] = [
  {
    id: 1,
    title: "F y E TRANSCOM S.A.",
    ruc: "20395430018",
    usuarios: ["Gimenez, Andres (Ext)"]
  },
  {
    id: 2,
    title: "A y P LOGISTI-K DEL PERU S.A.C",
    ruc: "20602039413",
    usuarios: ["Gimenez, Andres (Ext)"]
  },
  {
    id: 3,
    title: "SERV. ABASTEC. Y TRANSP. S.R.L",
    ruc: "20306434889",
    usuarios: ["Gimenez, Andres (Ext)"]
  },
  {
    id: 4,
    title: "TRANSPORTES TURISTICOS SAKURA S.A.",
    ruc: "20122051804",
    usuarios: ["Gimenez, Andres (Ext)"]
  },
  {
    id: 5,
    title: "ABC",
    ruc: "20122051800",
    usuarios: ["Gimenez, Andres (Ext)"]
  }
];
