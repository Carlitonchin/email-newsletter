import { Buffer } from 'node:buffer';
import type { gmail_v1 } from 'googleapis';

/** Lee el valor de una cabecera (From, Subject, Date, ...) sin importar mayúsculas. */
export function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string {
  const match = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return match?.value ?? '';
}

/** Decodifica el cuerpo de un correo, que Gmail entrega en base64url. */
function decodeBody(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

export interface MessageBodies {
  text: string;
  html: string;
}

/**
 * Recorre el árbol de "parts" de un mensaje y junta el texto plano y el HTML.
 * Un correo puede ser una sola parte o estar anidado en varias (multipart).
 */
export function extractBodies(payload: gmail_v1.Schema$MessagePart | undefined): MessageBodies {
  const bodies: MessageBodies = { text: '', html: '' };

  const walk = (part: gmail_v1.Schema$MessagePart | undefined): void => {
    if (!part) return;
    const data = part.body?.data;
    if (data) {
      if (part.mimeType === 'text/plain') bodies.text += decodeBody(data);
      else if (part.mimeType === 'text/html') bodies.html += decodeBody(data);
    }
    part.parts?.forEach(walk);
  };

  walk(payload);
  return bodies;
}

/**
 * Convierte HTML a texto legible. No es un parser completo, pero limpia las
 * newsletters lo suficiente para leerlas en consola o pasarlas a un modelo.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|tr|h[1-6]|li|ul|ol|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Devuelve el mejor texto disponible: el plano si existe, si no el HTML limpiado. */
export function bestText(bodies: MessageBodies): string {
  return bodies.text.trim() || htmlToText(bodies.html);
}
