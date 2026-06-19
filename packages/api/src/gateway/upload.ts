import { computeSign, serializeData } from "../proxy/sign.js";
import { getTimestamp } from "../proxy/request-entity.js";

export interface UploadFileParams {
  url: string;
  file: Blob;
  filename: string;
  contentType?: string;
  token?: string;
  ticket?: string;
  fetchImpl?: typeof fetch;
}

/** Binary upload aligned with beeant postBodyData (BFS UploadImage etc.). */
export async function uploadFile(params: UploadFileParams): Promise<unknown> {
  const fetchImpl = params.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const timestamp = getTimestamp();
  const dataMeta = serializeData({ FileName: params.filename });
  const sign = computeSign(dataMeta, timestamp, params.token ?? "");

  const query = new URLSearchParams({
    Data: dataMeta,
    Sign: sign,
    Timestamp: String(timestamp),
    ...(params.ticket ? { Ticket: params.ticket } : {}),
    ...(params.token ? { Token: params.token } : {}),
  });

  const response = await fetchImpl(`${params.url}?${query.toString()}`, {
    method: "POST",
    headers: { "Content-Type": params.contentType ?? "image/jpeg" },
    body: params.file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: HTTP ${response.status}`);
  }

  return response.json();
}
