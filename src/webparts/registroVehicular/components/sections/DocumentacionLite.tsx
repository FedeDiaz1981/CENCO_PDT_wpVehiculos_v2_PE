import * as React from "react";
import { Icon, Separator } from "@fluentui/react";
import { classes } from "../../ui/styles";
import { DocCard } from "../atoms/DocCard";

type DocFileValue = File | { name: string; url?: string } | string | undefined;

type DocStateLocal = {
  propFile?: DocFileValue;

  revTecDate?: string;
  revTecText?: string;
  revTecFile?: DocFileValue;

  resBonificacionFile?: DocFileValue;

  fumigacionDate?: string;
  fumigacionFile?: DocFileValue;

  SanipesDate?: string;
  SanipesText?: string;
  sanipesFile?: DocFileValue;

  termokingDate?: string;
  termokingFile?: DocFileValue;

  limpiezaDate?: string;
  limpiezaFile?: DocFileValue;
};

const hasValue = (v: DocFileValue): boolean => {
  if (!v) return false;
  if (v instanceof File) return true;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "object" && "name" in v)
    return String(v.name || "").trim().length > 0;
  return false;
};

const DocumentacionLite: React.FC<{
  doc: DocStateLocal;
  setDoc: React.Dispatch<React.SetStateAction<DocStateLocal>>;
  showTermoking?: boolean;
  showSanipes?: boolean;
  showFumigacion?: boolean;
  showLimpieza?: boolean;
  showResBonificacion?: boolean;
  disabled?: boolean;

  // NUEVO: para marcar reciÃ©n despuÃ©s de intentar guardar
  showValidation?: boolean;
}> = ({
  doc,
  setDoc,
  showTermoking = false,
  showSanipes = false,
  showFumigacion = false,
  showLimpieza = false,
  showResBonificacion = false,
  disabled = false,
  showValidation = false,
}) => {
  const setField =
    <K extends keyof DocStateLocal>(k: K) =>
    (v: DocStateLocal[K]): void => {
      if (disabled) return;
      setDoc((s) => ({ ...s, [k]: v }));
    };

  const handleFileChange =
    (field: keyof DocStateLocal, label: string) =>
    (f?: File): void => {
      if (disabled) return;

      setDoc((s) => ({ ...(s || {}), [field]: f }));

      if (f) {
        const name = f.name || "";
        window.alert(
          `Documento "${label}" se adjuntÃ³ correctamente${
            name ? ` (${name})` : ""
          }.`
        );
      } else {
        window.alert(`No se adjuntÃ³ ningÃºn archivo para "${label}".`);
      }
    };

  const fileOut = (f: DocFileValue): File | undefined =>
    f instanceof File ? f : undefined;

  const getExistingName = (f: DocFileValue): string | undefined => {
    if (!f) return undefined;
    if (typeof f === "string") return f;
    if (typeof f === "object" && "name" in f) return String(f.name);
    return undefined;
  };

  const getExistingUrl = (f: DocFileValue): string | undefined => {
    if (!f) return undefined;
    if (typeof f === "object" && "url" in f) return String(f.url || "");
    return undefined;
  };

  const yearOptions = React.useMemo((): { key: string; text: string }[] => {
    const currentYear = new Date().getFullYear();
    const arr: { key: string; text: string }[] = [];
    for (let y = currentYear; y >= 1980; y--)
      arr.push({ key: String(y), text: String(y) });
    return arr;
  }, []);

  const todayStr = React.useMemo((): string => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  // =========================
  // invalid flags (obligatorios)
  // =========================
  const invalidTarjeta = !hasValue(doc.propFile);

  const invalidBonificacion = false;
  const invalidFumigacion = false;
  const invalidRevisionTecnica = false;
  const invalidTermoking = false;
  const invalidLimpieza = false;

  return (
    <div
      className={classes.card}
      style={disabled ? { opacity: 0.6, pointerEvents: "auto" } : {}}
    >
      <div className={classes.cardHeader}>
        <Icon iconName="Document" />
        <div className={classes.cardTitle}>2 - DocumentaciÃ³n</div>
      </div>
      <Separator />

      <div className={classes.docsGrid}>
        <DocCard
          title="Tarjeta de propiedad *"
          file={fileOut(doc.propFile)}
          existingFileName={getExistingName(doc.propFile)}
          fileUrl={getExistingUrl(doc.propFile)}
          onFileChange={
            disabled
              ? undefined
              : handleFileChange("propFile", "Tarjeta de propiedad")
          }
          invalid={invalidTarjeta}
          showValidation={showValidation}
        />

        {showResBonificacion && (
          <DocCard
            title="ResoluciÃ³n de bonificaciÃ³n"
            file={fileOut(doc.resBonificacionFile)}
            existingFileName={getExistingName(doc.resBonificacionFile)}
          fileUrl={getExistingUrl(doc.resBonificacionFile)}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "resBonificacionFile",
                    "ResoluciÃ³n de bonificaciÃ³n"
                  )
            }
            invalid={invalidBonificacion}
            showValidation={showValidation}
          />
        )}

        {showFumigacion && (
          <DocCard
            title="Certificado de fumigaciÃ³n"
            dateLabel="Fecha de emisiÃ³n"
            dateValue={doc.fumigacionDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v?: string) => setField("fumigacionDate")(v || "")
            }
            dateMax={todayStr}
            file={fileOut(doc.fumigacionFile)}
            existingFileName={getExistingName(doc.fumigacionFile)}
          fileUrl={getExistingUrl(doc.fumigacionFile)}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "fumigacionFile",
                    "Certificado de fumigaciÃ³n"
                  )
            }
            invalid={invalidFumigacion}
            showValidation={showValidation}
          />
        )}

        <DocCard
          title="RevisiÃ³n tÃ©cnica"
          dateLabel="Fecha de vencimiento"
          dateValue={doc.revTecDate || ""}
          onDateChange={
            disabled
              ? undefined
              : (v?: string) => setField("revTecDate")(v || "")
          }
          dateMin={todayStr}
          textLabel="AÃ±o de fabricaciÃ³n"
          textValue={doc.revTecText || ""}
          onTextChange={
            disabled ? undefined : (v?: string) => setField("revTecText")(v || "")
          }
          textAsDropdown
          textOptions={yearOptions}
          file={fileOut(doc.revTecFile)}
          existingFileName={getExistingName(doc.revTecFile)}
          fileUrl={getExistingUrl(doc.revTecFile)}
          onFileChange={
            disabled
              ? undefined
              : handleFileChange("revTecFile", "RevisiÃ³n tÃ©cnica")
          }
          invalid={invalidRevisionTecnica}
          showValidation={showValidation}
        />

        {showSanipes && (
          <DocCard
            title="SANIPES"
            dateLabel="Fecha de resoluciÃ³n"
            dateValue={doc.SanipesDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v?: string) => setField("SanipesDate")(v || "")
            }
            dateMax={todayStr}
            textLabel="NÂ° de expediente"
            textValue={doc.SanipesText || ""}
            onTextChange={
              disabled
                ? undefined
                : (v?: string) => setField("SanipesText")(v || "")
            }
            file={fileOut(doc.sanipesFile)}
            existingFileName={getExistingName(doc.sanipesFile)}
          fileUrl={getExistingUrl(doc.sanipesFile)}
            onFileChange={
              disabled ? undefined : handleFileChange("sanipesFile", "SANIPES")
            }
            // no obligatorio => sin invalid
            showValidation={showValidation}
          />
        )}

        {showTermoking && (
          <DocCard
            title="Certificado de mantenimiento de termoking"
            dateLabel="Fecha de emisiÃ³n"
            dateValue={doc.termokingDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v?: string) => setField("termokingDate")(v || "")
            }
            dateMax={todayStr}
            file={fileOut(doc.termokingFile)}
            existingFileName={getExistingName(doc.termokingFile)}
          fileUrl={getExistingUrl(doc.termokingFile)}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange(
                    "termokingFile",
                    "Certificado de mantenimiento de termoking"
                  )
            }
            invalid={invalidTermoking}
            showValidation={showValidation}
          />
        )}

        {showLimpieza && (
          <DocCard
            title="Limpieza y desinfecciÃ³n"
            dateLabel="Fecha de emisiÃ³n"
            dateValue={doc.limpiezaDate || ""}
            onDateChange={
              disabled
                ? undefined
                : (v?: string) => setField("limpiezaDate")(v || "")
            }
            dateMax={todayStr}
            file={fileOut(doc.limpiezaFile)}
            existingFileName={getExistingName(doc.limpiezaFile)}
          fileUrl={getExistingUrl(doc.limpiezaFile)}
            onFileChange={
              disabled
                ? undefined
                : handleFileChange("limpiezaFile", "Limpieza y desinfecciÃ³n")
            }
            invalid={invalidLimpieza}
            showValidation={showValidation}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentacionLite;
