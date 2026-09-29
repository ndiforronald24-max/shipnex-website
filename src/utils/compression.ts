// src/utils/compression.ts
// Lightweight compression helpers using browser-native CompressionStream API.
// Falls back to identity (no compression) when the API is unavailable.

export interface CompressedPayload {
  compressed: boolean;
  data: string; // base64 when compressed, plain json string when not
  algo?: string;
}

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function compress(value: unknown): Promise<CompressedPayload> {
  try {
    if (typeof CompressionStream === 'undefined') {
      return { compressed: false, data: JSON.stringify(value) };
    }
    const json = JSON.stringify(value);
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate'));
    const buffer = await new Response(stream).arrayBuffer();
    const base64 = await arrayBufferToBase64(buffer);
    return { compressed: true, data: base64, algo: 'deflate-base64' };
  } catch {
    return { compressed: false, data: JSON.stringify(value) };
  }
}

export async function decompress(payload: CompressedPayload): Promise<unknown> {
  if (!payload.compressed) {
    return JSON.parse(payload.data);
  }
  try {
    if (typeof DecompressionStream === 'undefined') {
      return JSON.parse(payload.data);
    }
    const buffer = base64ToArrayBuffer(payload.data);
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('deflate'));
    const decompressed = await new Response(stream).text();
    return JSON.parse(decompressed);
  } catch {
    return JSON.parse(payload.data);
  }
}
