import { computeSign, serializeData } from "../proxy/sign.js";
import { getTimestamp } from "../proxy/request-entity.js";

export interface UploadFileParams {
  url: string;
  file: Blob;
  filename: string;
  method: string;
  domain?: string;
  contentType?: string;
  token?: string;
  ticket?: string;
  fetchImpl?: typeof fetch;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return globalThis.btoa(binary);
}

/** Legacy-aligned upload: x-www-form-urlencoded with Data + FileValue. */
export async function uploadFile(params: UploadFileParams): Promise<unknown> {
  const fetchImpl = params.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const timestamp = getTimestamp();
  const dataMeta = serializeData({ FileName: params.filename });
  const sign = computeSign(dataMeta, timestamp, params.token ?? "");
  const fileValue = await blobToBase64(params.file);
  const body = new URLSearchParams({
    Timestamp: String(timestamp),
    Language: "cn",
    Ticket: params.ticket ?? "",
    TicketName: "",
    Domain: params.domain ?? "rtesp.com",
    Method: params.method,
    Data: dataMeta,
    FileValue: fileValue,
    Token: params.token ?? "",
    Sign: sign,
    "x-requested-with": "XMLHttpRequest",
  });

  const response = await fetchImpl(params.url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: HTTP ${response.status}`);
  }

  return response.json();
}
