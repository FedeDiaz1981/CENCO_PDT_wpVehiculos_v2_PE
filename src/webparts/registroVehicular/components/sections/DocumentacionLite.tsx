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
}> = ({
  doc,
  setDoc,
  showTermoking = false,
  showSanipes = false,
  showFumigacion = false,
  showLimpieza = false,
  showResBonificacion = false,
}) => {
  const setField =
    <K extends keyof DocStateLocal>(k: K) =>
    (v: DocStateLocal[K]) =>
      setDoc((s) => ({ ...s, [k]: v }));

  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr: { key: string; text: string }[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      arr.push({ key: String(y), text: String(y) });
    }
    return arr;
  }, []);

  return (
    <div className={classes.card}>
      <div className={classes.cardHeader}>
        <Icon iconName="Document" />
        <div className={classes.cardTitle}>2 - Documentación</div>
      </div>
      <Separator />

      <div className={classes.docsGrid}>
        <DocCard
          title="Tarjeta de propiedad"
          file={doc.propFile}
          onFileChange={(f) => setField("propFile")(f)}
        />

        {showResBonificacion && (
          <DocCard
            title="Resolución de bonificación"
            file={doc.resBonificacionFile}
            onFileChange={(f) => setField("resBonificacionFile")(f)}
          />
        )}

        {showFumigacion && (
          <DocCard
            title="Certificado de fumigación"
            dateLabel="Fecha de emisión"
            dateValue={doc.fumigacionDate || ""}
            onDateChange={(v) => setField("fumigacionDate")(v || "")}
            file={doc.fumigacionFile}
            onFileChange={(f) => setField("fumigacionFile")(f)}
          />
        )}

        <DocCard
          title="Revisión técnica"
          dateLabel="Fecha de vencimiento"
          dateValue={doc.revTecDate || ""}
          onDateChange={(v) => setField("revTecDate")(v || "")}
          textLabel="Año de fabricación"
          textValue={doc.revTecText || ""}
          onTextChange={(v) => setField("revTecText")(v || "")}
          textAsDropdown
          textOptions={yearOptions}
          file={doc.revTecFile}
          onFileChange={(f) => setField("revTecFile")(f)}
        />

        {showSanipes && (
          <DocCard
            title="Sanipes"
            dateLabel="Fecha de resolución"
            dateValue={doc.SanipesDate || ""}
            onDateChange={(v) => setField("SanipesDate")(v || "")}
            textLabel="N° de expediente"
            textValue={doc.SanipesText || ""}
            onTextChange={(v) => setField("SanipesText")(v || "")}
            file={doc.sanipesFile}
            onFileChange={(f) => setField("sanipesFile")(f)}
          />
        )}

        {showTermoking && (
          <DocCard
            title="Certificado de mantenimiento de termoking"
            dateLabel="Fecha de emisión"
            dateValue={doc.termokingDate || ""}
            onDateChange={(v) => setField("termokingDate")(v || "")}
            file={doc.termokingFile}
            onFileChange={(f) => setField("termokingFile")(f)}
          />
        )}

        {showLimpieza && (
          <DocCard
            title="Limpieza y desinfección"
            dateLabel="Fecha de emisión"
            dateValue={doc.limpiezaDate || ""}
            onDateChange={(v) => setField("limpiezaDate")(v || "")}
            file={doc.limpiezaFile}
            onFileChange={(f) => setField("limpiezaFile")(f)}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentacionLite;
