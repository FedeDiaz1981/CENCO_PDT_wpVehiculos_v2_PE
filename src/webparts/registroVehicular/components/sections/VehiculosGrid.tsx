// VehiculosGrid.tsx
import * as React from "react";
import { IVehiculoItem } from "../../services/vehiculos.service";
import { classes } from "../../ui/styles";
import { Icon } from "@fluentui/react";

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
  fontWeight: 600,
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  background: "#f5f5f5",
  zIndex: 1
};

const tdStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap"
};

const trStyle: React.CSSProperties = {
  cursor: "pointer"
};

interface Props {
  vehiculos: IVehiculoItem[];
  onRowDoubleClick: (veh: IVehiculoItem) => void;
}

export const VehiculosGrid: React.FC<Props> = ({ vehiculos, onRowDoubleClick }) => {
  // filtro local
  const [filtro, setFiltro] = React.useState<string>("");

  // lista filtrada
  const listaFiltrada = React.useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return vehiculos;

    return vehiculos.filter(v => {
      const placa = (v.Title || "").toLowerCase();
      const prov = (v.Proveedor || "").toLowerCase();
      const soat = (v.SOAT || "").toLowerCase();
      const cod = (v.CodigoInterno || "").toLowerCase();
      return (
        placa.includes(f) ||
        prov.includes(f) ||
        soat.includes(f) ||
        cod.includes(f)
      );
    });
  }, [vehiculos, filtro]);

  return (
    <div className={classes.card} style={{ marginBottom: 16 }}>
      {/* Header de la sección */}
      <div className={classes.cardHeader}>
        <Icon iconName="FabricAssetLibrary" />
        <div className={classes.cardTitle}>Listado de vehículos</div>
      </div>

      {/* Filtro */}
      <div style={{ padding: "8px 16px 0 16px" }}>
        <input
          type="text"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Filtrar por placa, proveedor, SOAT o código…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontSize: 13,
            padding: "6px 8px",
            borderRadius: 4,
            border: "1px solid #ccc",
            outline: "none"
          }}
        />
      </div>

      {/* Tabla con scroll */}
      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          marginTop: 12,
          borderTop: "1px solid #eee"
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Placa</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>SOAT</th>
              <th style={thStyle}>Código</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.map(v => (
              <tr
                key={v.Id}
                style={trStyle}
                onDoubleClick={() => onRowDoubleClick(v)}
              >
                <td style={tdStyle}>{v.Title}</td>
                <td style={tdStyle}>{v.Proveedor}</td>
                <td style={tdStyle}>{v.SOAT}</td>
                <td style={tdStyle}>{v.CodigoInterno}</td>
              </tr>
            ))}

            {listaFiltrada.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    ...tdStyle,
                    fontStyle: "italic",
                    color: "#666",
                    paddingTop: 24,
                    paddingBottom: 24,
                    textAlign: "center"
                  }}
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
