import { SP } from "../../../pnp";
import { SPFI } from "@pnp/sp";
import { LISTS, CERT_FIELDS } from "./fields";

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";

export interface ICertificadoItem {
  Id: number;
  Title: string;      // la placa
  tipoCert: string;   // nombre del certificado
  FechaVencimiento?: string;
  NumeroDocumento?: string;
}

// --- helpers básicos ---
const esc = (s: string) => (s || "").replace(/'/g, "''");

function sanitizeFileName(name?: string): string {
  const base = (name ?? "archivo")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*]/g, "_")
    .slice(0, 120);
  return base.replace(/[.\s]+$/u, "");
}

async function ensureAttachmentsEnabled(sp: SPFI, listTitle: string) {
  const meta = await sp.web.lists.getByTitle(listTitle).select("EnableAttachments")();
  if (meta?.EnableAttachments === false) {
    await sp.web.lists.getByTitle(listTitle).update({ EnableAttachments: true });
  }
}

// ======================================================
// 1) upsert de UN certificado (modelo Personas)
// ======================================================

async function addCertificadoYObtenerId(
  sp: SPFI,
  placa: string,
  tipo: string,
  payload: any,
  listTitle: string = LISTS.Certificados
): Promise<number> {
  const list = sp.web.lists.getByTitle(listTitle);

  // 1. intentamos crear
  const addRes = await list.items.add({
    [CERT_FIELDS.Title]: placa,
    [CERT_FIELDS.Certificado]: tipo,
    ...payload,
  });

  // 2. tratamos de sacar el Id directo
  let id = addRes?.data?.Id ?? addRes?.data?.ID ?? 0;

  // 3. si no vino, lo buscamos
  if (!id) {
    const found: any[] = await list.items
      .select("Id")
      .filter(
        `${CERT_FIELDS.Title} eq '${esc(placa)}' and ${CERT_FIELDS.Certificado} eq '${esc(
          tipo
        )}'`
      )
      .orderBy("Id", false)  // el más nuevo primero
      .top(1)();

    id = found?.[0]?.Id ?? 0;
  }

  if (!id) {
    throw new Error("No se pudo obtener el Id del certificado creado.");
  }

  return id;
}

export async function upsertCertificadoVehiculo(opts: {
  placa: string;
  tipo: string;
  emision?: string | null;
  caducidad?: string | null;
  anio?: string | number | null;
  resolucion?: string | null;
  expediente?: string | null;
  file?: File | null;
  listTitle?: string;
}): Promise<{ id: number; archivo?: string | null }> {
  const {
    placa,
    tipo,
    emision,
    caducidad,
    anio,
    resolucion,
    expediente,
    file,
    listTitle = LISTS.Certificados,
  } = opts;

  const sp = SP();
  await ensureAttachmentsEnabled(sp, listTitle);
  const list = sp.web.lists.getByTitle(listTitle);

  // 1. ¿ya existe este certificado para esta placa?
  const existing: any[] = await list.items
    .select("Id")
    .filter(
      `${CERT_FIELDS.Title} eq '${esc(placa)}' and (${CERT_FIELDS.Certificado} eq '${esc(
        tipo
      )}' or ${CERT_FIELDS.Certificado} eq '${esc(tipo.toUpperCase())}')`
    )
    .orderBy("Id", false)
    .top(1)();

  // payload con sólo lo que vino
  const payload: any = {};
  if (emision !== undefined) payload[CERT_FIELDS.Emision] = emision;
  if (caducidad !== undefined) payload[CERT_FIELDS.Caducidad] = caducidad;
  if (anio !== undefined && anio !== null && anio !== "")
    payload[CERT_FIELDS.Anio] = String(anio);
  if (resolucion !== undefined) payload[CERT_FIELDS.Resolucion] = resolucion;
  if (expediente !== undefined) payload[CERT_FIELDS.Expediente] = expediente;

  let id: number;

  if (existing.length) {
    // actualizar
    id = existing[0].Id;
    if (Object.keys(payload).length) {
      await list.items.getById(id).update(payload);
    }
  } else {
  
    id = await addCertificadoYObtenerId(sp, placa, tipo, payload);
  }

  // 2. adjunto (opcional)
  let archivo: string | null = null;
  if (file instanceof File) {
    const item = list.items.getById(id);
    const current = await item.attachmentFiles();
    if (current?.length) {
      for (const a of current) {
        try {
          await item.attachmentFiles.getByName(a.FileName).delete();
        } catch {
          /* ignore */
        }
      }
    }
    const fname = sanitizeFileName(file.name);
    const bytes = await file.arrayBuffer();
    await item.attachmentFiles.add(fname, bytes);

    const withFiles = await item.select("AttachmentFiles/FileName").expand("AttachmentFiles")();
    archivo = withFiles?.AttachmentFiles?.[0]?.FileName ?? fname;
  }

  return { id, archivo: archivo ?? null };
}

// ======================================================
// 2) guardar TODOS los certificados derivados de la UI
//    (llama al de arriba varias veces)
// ======================================================
export async function saveCertificadosDeVehiculoSimple(args: {
  placa: string;
  doc: any;
  docsFlags: {
    showTermoking: boolean;
    showSanipes: boolean;
    showFumigacion: boolean;
    showLimpieza: boolean;
    showResBonificacion: boolean;
  };
}): Promise<void> {
  const { placa, doc, docsFlags } = args;

  // 1. tarjeta (siempre)
  await upsertCertificadoVehiculo({
    placa,
    tipo: "Tarjeta de propiedad",
    file: doc.propFile ?? null,
  });

  // 2. resolución / bonificación
  if (docsFlags.showResBonificacion) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Bonificación",
      file: doc.resBonificacionFile ?? null,
    });
  }

  // 3. fumigación
  if (docsFlags.showFumigacion) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Fumigación",
      emision: doc.fumigacionDate ?? null,
      file: doc.fumigacionFile ?? null,
    });
  }

  // 4. revisión técnica (siempre la mostrás)
  await upsertCertificadoVehiculo({
    placa,
    tipo: "Revisión técnica",
    caducidad: doc.revTecDate ?? null,
    anio: doc.revTecText ?? null,
    file: doc.revTecFile ?? null,
  });

  // 5. sanipes
  if (docsFlags.showSanipes) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Sanipes",
      resolucion: doc.SanipesDate ?? null,
      expediente: doc.SanipesText ?? null,
      file: doc.sanipesFile ?? null,
    });
  }

  // 6. termoking
  if (docsFlags.showTermoking) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Termoking",
      emision: doc.termokingDate ?? null,
      file: doc.termokingFile ?? null,
    });
  }

  // 7. limpieza y desinfección
  if (docsFlags.showLimpieza) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Limpieza y desinfección",
      emision: doc.limpiezaDate ?? null,
      file: doc.limpiezaFile ?? null,
    });
  }
}

// ======================================================
// 3) listado simple (para la grilla)
// ======================================================
export type CertRow = {
  id: number;
  tipo: string;
  emision?: string | null;
  caducidad?: string | null;
  resolucion?: string | null;
  anio?: string | number | null;
  expediente?: string | null;
  archivo?: string | null;
};

export async function getCertificadosListado(
  placa: string,
  listTitle: string = LISTS.Certificados
): Promise<CertRow[]> {
  const sp = SP();
  const items: any[] = await sp.web.lists
    .getByTitle(listTitle)
    .items.select(
      `Id,${CERT_FIELDS.Title},${CERT_FIELDS.Certificado},${CERT_FIELDS.Emision},${CERT_FIELDS.Caducidad},${CERT_FIELDS.Anio},${CERT_FIELDS.Resolucion},${CERT_FIELDS.Expediente},AttachmentFiles/FileName`
    )
    .expand("AttachmentFiles")
    .filter(`${CERT_FIELDS.Title} eq '${esc(placa)}'`)
    .orderBy("Id", false)();

  const rows: CertRow[] = items.map((it) => ({
    id: it.Id,
    tipo: (it[CERT_FIELDS.Certificado] || "").toString(),
    emision: it[CERT_FIELDS.Emision] ?? null,
    caducidad: it[CERT_FIELDS.Caducidad] ?? null,
    resolucion: it[CERT_FIELDS.Resolucion] ?? null,
    anio: it[CERT_FIELDS.Anio] ?? null,
    expediente: it[CERT_FIELDS.Expediente] ?? null,
    archivo: it.AttachmentFiles?.[0]?.FileName ?? null,
  }));

  return rows;
}

// ======================================================
// 4) borrar todo por placa (simple)
// ======================================================
export async function deleteCertificadosPorPlaca(
  placa: string,
  listTitle: string = LISTS.Certificados
): Promise<void> {
  const sp = SP();
  const list = sp.web.lists.getByTitle(listTitle);
  const items = await list.items.select("Id").filter(`${CERT_FIELDS.Title} eq '${esc(placa)}'`)();
  for (const it of items) {
    await list.items.getById(it.Id).delete();
  }
}
