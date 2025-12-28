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
    if (typeof val === "string") return val;
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split("T")[0];
    }
    return "";
  };

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

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // string YYYY-MM-DD para dateMin/dateMax del input type="date"
  const todayStr = React.useMemo(() => {
    return today.toISOString().slice(0, 10);
  }, [today]);

  const isWithinLastMonths = (d: Date | null, n: number) =>
    !!d && d >= monthsAgo(n);

  const isFuture = (d: Date | null) => {
    if (!d) return false;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x > today;
  };

  const isEmissionField = (field: keyof DocState) =>
    field === "fumigacionDate" ||
    field === "termokingDate" ||
    field === "limpiezaDate" ||
    field === "SanipesDate"; // si no querés SANIPES, sacá esta línea

  // handler para guardar fechas como string
  const handleDateChange =
    (field: keyof DocState) =>
    (value: string) => {
      const d = toComparableDate(value);

      // Solo bloqueamos FUTURO en campos "de emisión" (no en vencimiento)
      if (isEmissionField(field) && isFuture(d)) {
        window.alert(
          "La fecha de emisión no puede ser mayor a la fecha actual."
        );
        return;
      }

      // Para vencimientos, no bloqueamos futuro; la restricción se hace con dateMin en el calendario
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

  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    const e: string[] = [];

    // ---------- Reglas: "no futuro" para fechas de emisión ----------
    if (showFumigacion) {
      const fd = toComparableDate(doc.fumigacionDate as any);
      if (isFuture(fd))
        e.push("Fumigación: la fecha de emisión no puede ser mayor a hoy.");
    }

    if (showTermoking) {
      const td = toComparableDate(doc.termokingDate as any);
      if (isFuture(td))
        e.push("Termoking: la fecha de emisión no puede ser mayor a hoy.");
    }

    if (showLimpieza) {
      const ld = toComparableDate(doc.limpiezaDate as any);
      if (isFuture(ld))
        e.push(
          "Limpieza y desinfección: la fecha de emisión no puede ser mayor a hoy."
        );
    }

    if (showSanipes) {
      const sd = toComparableDate(doc.SanipesDate as any);
      if (isFuture(sd)) e.push("SANIPES: la fecha no puede ser mayor a hoy.");
    }

    // ---------- Reglas existentes (pero evitando el bug de futuro) ----------
    // Fumigación <= 6 meses (solo si no es futura)
    if (showFumigacion) {
      const fd = toComparableDate(doc.fumigacionDate as any);
      if (fd && !isFuture(fd) && !isWithinLastMonths(fd, 6)) {
        e.push("Fumigación: la fecha de emisión no puede superar 6 meses.");
      }
    }

    // Revisión técnica: vencimiento >= hoy (puede ser futura, OK)
    {
      const rd = toComparableDate(doc.revTecDate as any);
      if (rd) {
        rd.setHours(0, 0, 0, 0);
        if (rd < today) {
          e.push(
            "Revisión técnica: la fecha de vencimiento debe estar vigente."
          );
        }
      }
    }

    // Termoking <= 6 meses (solo si no es futura)
    if (showTermoking) {
      const td = toComparableDate(doc.termokingDate as any);
      if (td && !isFuture(td) && !isWithinLastMonths(td, 6)) {
        e.push(
          "Termoking: la fecha de emisión no puede tener una antigüedad mayor a 6 meses."
        );
      }
    }

    // Limpieza <= 1 mes (solo si no es futura)
    if (showLimpieza) {
      const ld = toComparableDate(doc.limpiezaDate as any);
      if (ld && !isFuture(ld) && !isWithinLastMonths(ld, 1)) {
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
    doc.SanipesDate,
    showFumigacion,
    showTermoking,
    showLimpieza,
    showSanipes,
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
        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Tarjeta de propiedad"
            file={normalizeFileOut(doc.propFile)}
            onFileChange={handleFileChange("propFile", "Tarjeta de propiedad")}
          />
        </div>

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

        {showFumigacion && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de fumigación"
              dateLabel="Fecha de emisión"
              dateValue={normalizeDateOut(doc.fumigacionDate)}
              onDateChange={handleDateChange("fumigacionDate")}
              dateMax={todayStr} // <-- EMISIÓN: no futuro
              file={normalizeFileOut(doc.fumigacionFile)}
              onFileChange={handleFileChange(
                "fumigacionFile",
                "Certificado de fumigación"
              )}
            />
          </div>
        )}

        <div className={`${classes.docItem} ${classes.docLabelScope}`}>
          <DocCard
            title="Revisión técnica"
            dateLabel="Fecha de vencimiento"
            dateValue={normalizeDateOut(doc.revTecDate)}
            onDateChange={handleDateChange("revTecDate")}
            dateMin={todayStr} // <-- VENCIMIENTO: >= hoy
            textLabel="Año de fabricación"
            textValue={doc.revTecText ?? ""}
            onTextChange={(v) => set("revTecText")(String(v ?? ""))}
            textAsDropdown
            textOptions={yearOptions}
            file={normalizeFileOut(doc.revTecFile)}
            onFileChange={handleFileChange("revTecFile", "Revisión técnica")}
          />
        </div>

        {showSanipes && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="SANIPES"
              dateLabel="Fecha de resolución de expediente"
              dateValue={normalizeDateOut(doc.SanipesDate)}
              onDateChange={handleDateChange("SanipesDate")}
              dateMax={todayStr} // <-- como EMISIÓN/RESOLUCIÓN: no futuro
              textLabel="N° de expediente"
              textValue={doc.SanipesText ?? ""}
              onTextChange={(v) => set("SanipesText")(String(v ?? ""))}
              file={normalizeFileOut(doc.sanipesFile)}
              onFileChange={handleFileChange("sanipesFile", "SANIPES")}
            />
          </div>
        )}

        {showTermoking && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Certificado de mantenimiento de termoking"
              dateLabel="Fecha de emisión"
              dateValue={normalizeDateOut(doc.termokingDate)}
              onDateChange={handleDateChange("termokingDate")}
              dateMax={todayStr} // <-- EMISIÓN: no futuro
              file={normalizeFileOut(doc.termokingFile)}
              onFileChange={handleFileChange(
                "termokingFile",
                "Certificado de mantenimiento de termoking"
              )}
            />
          </div>
        )}

        {showLimpieza && (
          <div className={`${classes.docItem} ${classes.docLabelScope}`}>
            <DocCard
              title="Limpieza y desinfección"
              dateLabel="Fecha de emisión"
              dateValue={normalizeDateOut(doc.limpiezaDate)}
              onDateChange={handleDateChange("limpiezaDate")}
              dateMax={todayStr} // <-- EMISIÓN: no futuro
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
