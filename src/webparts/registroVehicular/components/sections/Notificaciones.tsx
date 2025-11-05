import * as React from "react";
import { Stack, StackItem, Label, TextField } from "@fluentui/react";
import { Vehiculo } from "../../models/vehiculo";
import { theme } from "../../ui/styles";

type Props = {
  vehiculo: Vehiculo;
  setVehiculo: React.Dispatch<React.SetStateAction<Vehiculo>>;
  disabled?: boolean;
};

export function Notificaciones({ vehiculo, setVehiculo, disabled }: Props) {
  // fuerza a string y saca cualquier tag html
  const toPlain = (v: any): string => {
    const s = String(v ?? "");
    return s
      .replace(/<[^>]*>/g, "") // quita etiquetas
      .replace(/&nbsp;/gi, " ") // quita nbsp
      .trim();
  };

  const value = toPlain(vehiculo.CorreosNotificacion);

  return (
    <Stack
      tokens={{ childrenGap: 12 }}
      styles={{
        root: {
          background: theme.palette.white,
          borderRadius: 12,
          padding: 16,
          boxShadow: (theme.effects as any).elevation8,
          marginTop: 12,
        },
      }}
    >
      <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>
        Notificaciones
      </Label>

      <Stack horizontal wrap tokens={{ childrenGap: 12 }}>
        <StackItem grow styles={{ root: { minWidth: 240 } }}>
          <TextField
            label="Correos de notificación"
            placeholder="correo1@dominio.com; correo2@dominio.com"
            value={value}
            onChange={(_, v) =>
              setVehiculo((s: any) => ({
                ...(s || {}),
                // guardamos ya limpio
                CorreosNotificacion: toPlain(v),
              }))
            }
            multiline
            autoAdjustHeight
            disabled={disabled}
          />
        </StackItem>
      </Stack>
    </Stack>
  );
}

export default Notificaciones;
