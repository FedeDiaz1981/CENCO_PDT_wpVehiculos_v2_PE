import * as React from "react";
import { Icon, Separator } from "@fluentui/react";
import { classes } from "../../ui/styles";
import { DocCard } from "../atoms/DocCard";

type DocStateLocal = {
  propFile?: any;
  revTecDate?: string;
  revTecText?: string;
  revTecFile?: any;
  resBonificacionFile?: any;
  fumigacionDate?: string;
  fumigacionFile?: any;
  SanipesDate?: string;
  SanipesText?: string;
  sanipesFile?: any;
  termokingDate?: string;
  termokingFile?: any;
  limpiezaDate?: string;
  limpiezaFile?: any;
};

const DocumentacionLite: React.FC<{
  doc: DocStateLocal;
  setDoc: React.Dispatch<React.SetStateAction<DocStateLocal>>;
  showTermoking?: boolean;
  showSanipes?: boolean;
  showFumigacion?: boolean;
  showLimpieza?: boolean;
  showResBonificacion?: boolean;
  // para bloquear toda la sección
  disabled?: boolean;
}> = ({
  doc,
  setDoc,
  showTermoking = false,
  showSanipes = false,
  showFumigacion = false,
  showLimpieza = false,
  showResBonificacion = false,
  disabled = false,
}) => {
  const setField =
    <K extends keyof DocStateLocal>(k: K) =>
    (v: DocStateLocal[K]) => {
      if (disabled) return;
      setDoc((s) => ({ ...s, [k]: v }));
    };

  // helper para manejar archivo + alert
  const handleFileChange =
    (field: keyof DocStateLocal, label: string) =>
    (f: any) => {
      if (disabled) return;

      setDoc((s) => ({ ...(s || {}), [field]: f }));

      if (f) {
        const name = f?.name ?? (typeof f === "string" ? f : "");
        window.alert(
          `Documento "${label}" se adjuntó correctamente${
            name ? ` (${name})` : ""
          }.`
        );
      } else {
        window.alert(`No se adjuntó ningún archivo para "${label}".`);
      }
    };

  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr: { key: string; text: string }[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      arr.push({ key: String(y), text: String(y) });
    }
    return arr;
  }, []);

  return (
    <div
      className={classes.card}
      style={disabled ? { opacity: 0.6, pointerEvents: "auto" } : {}}
    >
      <div className={classes.cardHeader}>
        <Icon iconName="Document" />
        <div className={classes.cardTitle}>2 - Documentación</div>
      </div>
      <Separator />

      <div className={classes.docsGrid}>
        {/* Tarjeta de propiedad – obligatorio */}
        <DocCard
          title="Tarjeta de propiedad *"
          file={doc.propFile}
          onFileChange={
            disabled
              ? undefined
              : handleFileChange("propFile", "Tarjeta de propiedad")
          }
        />

        {/* Resolución de bonificación – obligatorio cuando aplica */}
        {showResBonificacion && (
          <DocCard
            title="Resolución de bonificación *"
            file={doc.resBonificacionFile}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "resBonificacionFile",
                    "Resolución de bonificación"
                  )
            }
          />
        )}

        {/* Fumigación – obligatorio cuando aplica */}
        {showFumigacion && (
          <DocCard
            title="Certificado de fumigación *"
            dateLabel="Fecha de emisión *"
            dateValue={doc.fumigacionDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v) => setField("fumigacionDate")(v || "")
            }
            file={doc.fumigacionFile}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "fumigacionFile",
                    "Certificado de fumigación"
                  )
            }
          />
        )}

        {/* Revisión técnica – obligatorio */}
        <DocCard
          title="Revisión técnica *"
          dateLabel="Fecha de vencimiento *"
          dateValue={doc.revTecDate || ""}
          onDateChange={
            disabled ? undefined : (v) => setField("revTecDate")(v || "")
          }
          textLabel="Año de fabricación *"
          textValue={doc.revTecText || ""}
          onTextChange={
            disabled ? undefined : (v) => setField("revTecText")(v || "")
          }
          textAsDropdown
          textOptions={yearOptions}
          file={doc.revTecFile}
          onFileChange={
            disabled
              ? undefined
              : handleFileChange("revTecFile", "Revisión técnica")
          }
        />

        {/* SANIPES – NO obligatorio */}
        {showSanipes && (
          <DocCard
            title="SANIPES"
            dateLabel="Fecha de resolución"
            dateValue={doc.SanipesDate || ""}
            onDateChange={
              disabled ? undefined : (v) => setField("SanipesDate")(v || "")
            }
            textLabel="N° de expediente"
            textValue={doc.SanipesText || ""}
            onTextChange={
              disabled ? undefined : (v) => setField("SanipesText")(v || "")
            }
            file={doc.sanipesFile}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange("sanipesFile", "SANIPES")
            }
          />
        )}

        {/* Termoking – obligatorio cuando aplica */}
        {showTermoking && (
          <DocCard
            title="Certificado de mantenimiento de termoking *"
            dateLabel="Fecha de emisión *"
            dateValue={doc.termokingDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v) => setField("termokingDate")(v || "")
            }
            file={doc.termokingFile}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "termokingFile",
                    "Certificado de mantenimiento de termoking"
                  )
            }
          />
        )}

        {/* Limpieza y desinfección – obligatorio cuando aplica */}
        {showLimpieza && (
          <DocCard
            title="Limpieza y desinfección *"
            dateLabel="Fecha de emisión *"
            dateValue={doc.limpiezaDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v) => setField("limpiezaDate")(v || "")
            }
            file={doc.limpiezaFile}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "limpiezaFile",
                    "Limpieza y desinfección"
                  )
            }
          />
        )}
      </div>
    </div>
  );
};

export default DocumentacionLite;
