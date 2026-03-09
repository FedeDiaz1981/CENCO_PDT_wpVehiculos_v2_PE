import { SP } from "../../../pnp";
import type { SPFI } from "@pnp/sp";
import { LISTS, CERT_FIELDS } from "./fields";

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";

export interface ICertificadoItem {
  Id: number;
  Title: string; // la placa
  tipoCert: string; // nombre del certificado
  FechaVencimiento?: string;
  NumeroDocumento?: string;
}

// helpers
const esc = (s: string): string => String(s ?? "").replace(/'/g, "''");

function sanitizeFileName(name?: string): string {
  const base = (name ?? "archivo")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*]/g, "_")
    .slice(0, 120);
  return base.replace(/[.\s]+$/u, "");
}

async function ensureAttachmentsEnabled(sp: SPFI, listTitle: string): Promise<void> {
  const meta = (await sp.web.lists
    .getByTitle(listTitle)
    .select("EnableAttachments")()) as { EnableAttachments?: boolean };

  if (meta.EnableAttachments === false) {
    await sp.web.lists.getByTitle(listTitle).update({ EnableAttachments: true });
  }
}

// ======================================================
// 1) add y obtener Id robusto (sin IItemAddResult)
// ======================================================
type CreatedAddResult = {
  data?: { Id?: number; ID?: number };
  item?: { select: (s: string) => () => Promise<{ Id?: number }> };
};

async function addCertificadoYObtenerId(
  list: { items: { add: (p: Record<string, unknown>) => Promise<unknown>; select: (s: string) => any } },
  payload: Record<string, unknown>
): Promise<number> {
  const created = (await list.items.add(payload)) as CreatedAddResult;

  const id1 = created.data?.Id ?? created.data?.ID;
  if (typeof id1 === "number" && id1 > 0) return id1;

  try {
    const d = await created.item?.select("Id")?.();
    const id2 = d?.Id;
    if (typeof id2 === "number" && id2 > 0) return id2;
  } catch {
    // fallback
  }

  const placa = String(payload[CERT_FIELDS.Title] ?? payload.Title ?? "");
  const tipo = String(payload[CERT_FIELDS.Certificado] ?? "");

  if (placa && tipo) {
    const found = (await (list as any).items
      .select("Id")
      .filter(
        `${CERT_FIELDS.Title} eq '${esc(placa)}' and ${CERT_FIELDS.Certificado} eq '${esc(tipo)}'`
      )
      .orderBy("Id", false)
      .top(1)()) as Array<{ Id?: number }>;

    const id3 = found?.[0]?.Id;
    if (typeof id3 === "number" && id3 > 0) return id3;
  }

  throw new Error("No se pudo obtener el Id del certificado creado.");
}

// ======================================================
// 2) upsert de UN certificado (sin null)
// ======================================================
export async function upsertCertificadoVehiculo(opts: {
  placa: string;
  tipo: string;
  emision?: string;
  caducidad?: string;
  anio?: string | number;
  resolucion?: string;
  expediente?: string;
  file?: File;
  listTitle?: string;
}): Promise<{ id: number; archivo?: string }> {
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

  const existing = (await list.items
    .select("Id")
    .filter(
      `${CERT_FIELDS.Title} eq '${esc(placa)}' and (${CERT_FIELDS.Certificado} eq '${esc(
        tipo
      )}' or ${CERT_FIELDS.Certificado} eq '${esc(tipo.toUpperCase())}')`
    )
    .orderBy("Id", false)
    .top(1)()) as Array<{ Id: number }>;

  const patch: Record<string, unknown> = {};
  if (emision !== undefined) patch[CERT_FIELDS.Emision] = emision;
  if (caducidad !== undefined) patch[CERT_FIELDS.Caducidad] = caducidad;
  if (anio !== undefined && String(anio).trim() !== "") patch[CERT_FIELDS.Anio] = String(anio);
  if (resolucion !== undefined) patch[CERT_FIELDS.Resolucion] = resolucion;
  if (expediente !== undefined) patch[CERT_FIELDS.Expediente] = expediente;

  let id: number;

  if (existing.length > 0) {
    id = existing[0].Id;
    if (Object.keys(patch).length > 0) {
      await list.items.getById(id).update(patch);
    }
  } else {
    const createPayload: Record<string, unknown> = {
      [CERT_FIELDS.Title]: placa,
      [CERT_FIELDS.Certificado]: tipo,
      ...patch,
    };
    id = await addCertificadoYObtenerId(list as any, createPayload);
  }

  // adjunto (opcional)
  let archivo: string | undefined;

  if (file instanceof File) {
    const item = list.items.getById(id);

    const current = (await item.attachmentFiles()) as Array<{ FileName: string }>;
    for (const a of current ?? []) {
      try {
        await item.attachmentFiles.getByName(a.FileName).delete();
      } catch {
        /* ignore */
      }
    }

    const fname = sanitizeFileName(file.name);
    await item.attachmentFiles.add(fname, await file.arrayBuffer());

    const withFiles = (await item
      .select("AttachmentFiles/FileName")
      .expand("AttachmentFiles")()) as { AttachmentFiles?: Array<{ FileName?: string }> };

    archivo = withFiles.AttachmentFiles?.[0]?.FileName ?? fname;
  }

  return { id, archivo };
}

// ======================================================
// 3) guardar TODOS los certificados derivados de la UI
// ======================================================
type DocLike = {
  propFile?: unknown;
  resBonificacionFile?: unknown;
  fumigacionDate?: string;
  fumigacionFile?: unknown;
  revTecDate?: string;
  revTecText?: string;
  revTecFile?: unknown;
  SanipesDate?: string;
  SanipesText?: string;
  sanipesFile?: unknown;
  termokingDate?: string;
  termokingFile?: unknown;
  limpiezaDate?: string;
  limpiezaFile?: unknown;
};

const asFile = (v: unknown): File | undefined => (v instanceof File ? v : undefined);
const asOptionalText = (v: unknown): string | undefined => {
  if (v === undefined || v === null) return undefined;

  const value = String(v).trim();
  return value !== "" ? value : undefined;
};

export async function saveCertificadosDeVehiculoSimple(args: {
  placa: string;
  doc: DocLike;
  docsFlags: {
    showTermoking: boolean;
    showSanipes: boolean;
    showFumigacion: boolean;
    showLimpieza: boolean;
    showResBonificacion: boolean;
  };
}): Promise<void> {
  const { placa, doc, docsFlags } = args;

  await upsertCertificadoVehiculo({
    placa,
    tipo: "Tarjeta de propiedad",
    file: asFile(doc.propFile),
  });

  if (docsFlags.showResBonificacion) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Bonificación",
      file: asFile(doc.resBonificacionFile),
    });
  }

  if (docsFlags.showFumigacion) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Fumigación",
      emision: doc.fumigacionDate,
      file: asFile(doc.fumigacionFile),
    });
  }

  await upsertCertificadoVehiculo({
    placa,
    tipo: "Revisión técnica",
    caducidad: doc.revTecDate,
    anio: doc.revTecText,
    file: asFile(doc.revTecFile),
  });

  const sanipesDate = asOptionalText(doc.SanipesDate);
  const sanipesText = asOptionalText(doc.SanipesText);
  const sanipesFile = asFile(doc.sanipesFile);

  if (docsFlags.showSanipes && (sanipesDate || sanipesText || sanipesFile)) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Sanipes",
      resolucion: sanipesDate,
      expediente: sanipesText,
      file: sanipesFile,
    });
  }

  if (docsFlags.showTermoking) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Termoking",
      emision: doc.termokingDate,
      file: asFile(doc.termokingFile),
    });
  }

  if (docsFlags.showLimpieza) {
    await upsertCertificadoVehiculo({
      placa,
      tipo: "Limpieza y desinfección",
      emision: doc.limpiezaDate,
      file: asFile(doc.limpiezaFile),
    });
  }
}

// ======================================================
// 4) listado simple (para la grilla) - sin null
// ======================================================
export type CertRow = {
  id: number;
  tipo: string;
  emision?: string;
  caducidad?: string;
  resolucion?: string;
  anio?: string | number;
  expediente?: string;
  archivo?: string;
};

export async function getCertificadosListado(
  placa: string,
  listTitle: string = LISTS.Certificados
): Promise<CertRow[]> {
  const sp = SP();
  const items = (await sp.web.lists
    .getByTitle(listTitle)
    .items.select(
      `Id,${CERT_FIELDS.Title},${CERT_FIELDS.Certificado},${CERT_FIELDS.Emision},${CERT_FIELDS.Caducidad},${CERT_FIELDS.Anio},${CERT_FIELDS.Resolucion},${CERT_FIELDS.Expediente},AttachmentFiles/FileName`
    )
    .expand("AttachmentFiles")
    .filter(`${CERT_FIELDS.Title} eq '${esc(placa)}'`)
    .orderBy("Id", false)()) as Array<
    Record<string, unknown> & { Id: number; AttachmentFiles?: Array<{ FileName?: string }> }
  >;

  return items.map((it) => ({
    id: it.Id,
    tipo: String(it[CERT_FIELDS.Certificado] ?? ""),
    emision: it[CERT_FIELDS.Emision] !== undefined ? String(it[CERT_FIELDS.Emision]) : undefined,
    caducidad: it[CERT_FIELDS.Caducidad] !== undefined ? String(it[CERT_FIELDS.Caducidad]) : undefined,
    resolucion: it[CERT_FIELDS.Resolucion] !== undefined ? String(it[CERT_FIELDS.Resolucion]) : undefined,
    anio: it[CERT_FIELDS.Anio] as string | number | undefined,
    expediente: it[CERT_FIELDS.Expediente] !== undefined ? String(it[CERT_FIELDS.Expediente]) : undefined,
    archivo: it.AttachmentFiles?.[0]?.FileName,
  }));
}

// ======================================================
// 5) borrar todo por placa (usa delete() real)
// ======================================================
export async function deleteCertificadosPorPlaca(
  placa: string,
  listTitle: string = LISTS.Certificados
): Promise<void> {
  const sp = SP();
  const list = sp.web.lists.getByTitle(listTitle);

  const items = (await list.items
    .select("Id")
    .filter(`${CERT_FIELDS.Title} eq '${esc(placa)}'`)()) as Array<{ Id: number }>;

  for (const it of items) {
    await list.items.getById(it.Id).delete();
  }
}
