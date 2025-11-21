import * as React from "react";
import {
  Icon,
  Separator,
  MessageBar,
  MessageBarType,
} from "@fluentui/react";
import { classes } from "../../ui/styles";
import { DocCard } from "../atoms/DocCard";
import type { DocState } from "../../types";

type Props = {
  doc: DocState;
  setDoc: React.Dispatch<React.SetStateAction<DocState>>;
  showTermoking?: boolean;
  showSanipes?: boolean;
  showFumigacion?: boolean;
  showLimpieza?: boolean;
  showResBonificacion?: boolean;
  onValidityChange?: (ok: boolean, errors: string[]) => void;
};

export const Documentacion: React.FC<Props> = ({
  doc,
  setDoc,
  showTermoking = false,
  showSanipes = false,
  showFumigacion = false,
  showLimpieza = false,
  showResBonificacion = false,
  onValidityChange,
}) => {
  // -----------------------
  // Helpers de asignación
  // -----------------------
  const set =
    <K extends keyof DocState>(k: K) =>
    (v: DocState[K]) =>
      setDoc((s) => ({ ...s, [k]: v }));

  // convierte lo que venga en fecha (Date | string | null | undefined)
  // a un string "YYYY-MM-DD" (o "" si no hay valor)
  const normalizeDateOut = (val: unknown): string => {
    if (!val) return "";
    if (typeof val === "string") {
      return val;
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split("T")[0];
    }
    return "";
  };

  // handler para guardar fechas como string
  const handleDateChange =
    (field: keyof DocState) =>
    (value: string) => {
      set(field)(value as any);
    };

  // normaliza File | null | undefined a File | undefined
  const normalizeFileOut = (val: unknown): File | undefined => {
    if (!val) return undefined;
    if (val instanceof File) return val;
    return undefined;
  };

  // handler para guardar archivos + alert
  const handleFileChange =
    (field: keyof DocState, label: string) =>
    (f?: File) => {
      set(field)(f as any);

      if (f) {
        const name = f.name || "";
        window.alert(
          `Documento "${label}" se adjuntó correctamente${
            name ? ` (${name})` : ""
          }.`
        );
      }
    };

  // -----------------------
  // Dropdown de año (Año de fabricación)
  // -----------------------
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const opts: { key: string; text: string }[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      const ys = String(y);
      opts.push({ key: ys, text: ys });
    }
    return opts;
  }, []);

  // -----------------------
  // Validación
  // -----------------------

  const monthsAgo = (n: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - n);
    return d;
  };

  // admite string "YYYY-MM-DD" y también Date directamente
  const toComparableDate = (v: unknown): Date | null => {
    if (!v) return null;

    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) return null;
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }

    if (v instanceof Date) {
      return isNaN(v.getTime()) ? null : v;
    }

    return null;
  };

  const isWithinLastMonths = (d: Date | null, n: number) =>
    !!d && d >= monthsAgo(n);

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    const e: string[] = [];

    // Fumigación <= 6 meses
    if (showFumigacion) {
      const fd = toComparableDate(doc.fumigacionDate as any);
      if (fd && !isWithinLastMonths(fd, 6)) {
        e.push(
          "Fumigación: la fecha de emisión no puede superar 6 meses."
        );
      }
    }

    // Revisión técnica: vencimiento >= hoy
    {
      const rd = toComparableDate(doc.revTecDate as any);
      if (rd && rd < today) {
        e.push(
          "Revisión técnica: la fecha de vencimiento debe estar vigente."
        );
      }
    }

    // Termoking <= 6 meses
    if (showTermoking) {
      const td = toComparableDate(doc.termokingDate as any);
      if (td && !isWithinLastMonths(td, 6)) {
        e.push(
          "Termoking: la fecha de emisión no puede tener una antigüedad mayor a 6 meses."
        );
      }
    }

    // Limpieza <= 1 mes
    if (showLimpieza) {
      const ld = toComparableDate(doc.limpiezaDate as any);
      if (ld && !isWithinLastMonths(ld, 1)) {
        e.push(
          "Limpieza y desinfección: la fecha de emisión no puede superar 1 mes."
        );
      }
    }

    setErrors(e);
    onValidityChange?.(e.length === 0, e);
  }, [
    doc.fumigacionDate,
    doc.revTecDate,
    doc.termokingDate,
    doc.limpiezaDate,
    showFumigacion,
    showTermoking,
    showLimpieza,
    today,
    onValidityChange,
  ]);

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className={classes.card}>
      <div className={classes.cardHeader}>
        <Icon iconName="Document" />
        <div className={classes.cardTitle}>2- Documentación</div>
      </div>
      <Separator />

      {errors.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <MessageBar messageBarType={MessageBarType.error} isMultiline>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </MessageBar>
        </div>
      )}

      <div className={classes.docsGrid}>
        {/* Tarjeta de propiedad */}
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Tarjeta de propiedad"
            file={normalizeFileOut(doc.propFile)}
            onFileChange={handleFileChange("propFile", "Tarjeta de propiedad")}
          />
        </div>

        {/* Bonificación */}
        {showResBonificacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Resolución de bonificación"
              file={normalizeFileOut(doc.resBonificacionFile)}
              onFileChange={handleFileChange(
                "resBonificacionFile",
                "Resolución de bonificación"
              )}
            />
          </div>
        )}

        {/* Fumigación */}
        {showFumigacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de fumigación"
              dateLabel="Fecha de emisión"
              dateValue={normalizeDateOut(doc.fumigacionDate)}
              onDateChange={handleDateChange("fumigacionDate")}
              file={normalizeFileOut(doc.fumigacionFile)}
              onFileChange={handleFileChange(
                "fumigacionFile",
                "Certificado de fumigación"
              )}
            />
          </div>
        )}

        {/* Revisión técnica */}
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Revisión técnica"
            dateLabel="Fecha de vencimiento"
            dateValue={normalizeDateOut(doc.revTecDate)}
            onDateChange={handleDateChange("revTecDate")}
            textLabel="Año de fabricación"
            textValue={doc.revTecText ?? ""}
            onTextChange={(v) => set("revTecText")(String(v ?? ""))}
            textAsDropdown
            textOptions={yearOptions}
            file={normalizeFileOut(doc.revTecFile)}
            onFileChange={handleFileChange(
              "revTecFile",
              "Revisión técnica"
            )}
          />
        </div>

        {/* Sanipes */}
        {showSanipes && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="SANIPES"
              dateLabel="Fecha de resolución de expediente"
              dateValue={normalizeDateOut(doc.SanipesDate)}
              onDateChange={handleDateChange("SanipesDate")}
              textLabel="N° de expediente"
              textValue={doc.SanipesText ?? ""}
              onTextChange={(v) => set("SanipesText")(String(v ?? ""))}
              file={normalizeFileOut(doc.sanipesFile)}
              onFileChange={handleFileChange(
                "sanipesFile",
                "SANIPES"
              )}
            />
          </div>
        )}

        {/* Termoking */}
        {showTermoking && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de mantenimiento de termoking"
              dateLabel="Fecha de emisión"
              dateValue={normalizeDateOut(doc.termokingDate)}
              onDateChange={handleDateChange("termokingDate")}
              file={normalizeFileOut(doc.termokingFile)}
              onFileChange={handleFileChange(
                "termokingFile",
                "Certificado de mantenimiento de termoking"
              )}
            />
          </div>
        )}

        {/* Limpieza y desinfección */}
        {showLimpieza && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Limpieza y desinfección"
              dateLabel="Fecha de emisión"
              dateValue={normalizeDateOut(doc.limpiezaDate)}
              onDateChange={handleDateChange("limpiezaDate")}
              file={normalizeFileOut(doc.limpiezaFile)}
              onFileChange={handleFileChange(
                "limpiezaFile",
                "Limpieza y desinfección"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};
