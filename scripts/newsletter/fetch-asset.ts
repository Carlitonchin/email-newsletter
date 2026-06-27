import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * Download one image from the original newsletter into the repo, so the site is
 * self-contained (no hotlinking to CDNs that expire or block / track readers).
 *
 *   pnpm newsletter:asset <url> <date> <slug> [-- --name <basename>]
 *
 * It saves the file under `public/editions/<date>/<slug>/` (served at the site
 * root) and prints JSON with the `src` to drop into a `media` block, plus the
 * sniffed pixel `width`/`height` (set them so the layout reserves space).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9-]+$/;
const TIMEOUT_MS = 30_000;

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function printHelp(): void {
  console.log(`
Descarga una imagen del newsletter original al repo (sitio autocontenido).

Uso:
  pnpm newsletter:asset <url> <date> <slug> [-- --name <basename>]

  <url>    URL http(s) de la imagen (la sacás del campo .html del correo)
  <date>   Carpeta del día, YYYY-MM-DD
  <slug>   Slug del artículo (= nombre del archivo .json)

Opciones:
      --name <basename>  Nombre de archivo a usar (sin extensión)
  -h, --help             Muestra esta ayuda

Guarda en public/editions/<date>/<slug>/ e imprime el JSON con el "src" listo
para pegar en un bloque "media" (con width/height detectados).
`);
}

/** Best-effort intrinsic size from the file header (png/gif/jpeg/webp). */
function imageSize(buf: Buffer): { width: number; height: number } | undefined {
  // PNG
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.length >= 10 && buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // JPEG
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      // Start-of-frame markers carry the dimensions (skip DHT/JPG/DAC).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }
  // WebP
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fourcc = buf.toString('ascii', 12, 16);
    if (fourcc === 'VP8X') {
      const width = ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) >>> 0) + 1;
      const height = ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) >>> 0) + 1;
      return { width, height };
    }
    if (fourcc === 'VP8 ' && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fourcc === 'VP8L' && buf[20] === 0x2f) {
      const b = [buf[21], buf[22], buf[23], buf[24]];
      const width = ((b[1] & 0x3f) << 8 | b[0]) + 1;
      const height = ((b[3] & 0x0f) << 10 | b[2] << 2 | b[1] >> 6) + 1;
      return { width, height };
    }
  }
  return undefined;
}

function safeBase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** A unique, web-safe file name inside `dir`, derived from a base + extension. */
function uniqueName(dir: string, base: string, ext: string): string {
  const stem = safeBase(base) || 'figure';
  let candidate = `${stem}.${ext}`;
  let n = 2;
  while (existsSync(join(dir, candidate))) candidate = `${stem}-${n++}.${ext}`;
  return candidate;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) return printHelp();

  const nameFlag = argv.indexOf('--name');
  const explicitName = nameFlag !== -1 ? argv[nameFlag + 1] : undefined;
  const positionals = argv.filter((arg, i) => !arg.startsWith('-') && (nameFlag === -1 || i !== nameFlag + 1));
  const [url, date, slug] = positionals;

  if (!url || !date || !slug) {
    console.error('Faltan argumentos.\nUso: pnpm newsletter:asset <url> <date> <slug>  (ver --help)');
    process.exit(1);
  }
  if (!/^https?:\/\//.test(url)) {
    console.error(`URL inválida: "${url}" — debe empezar con http(s)://`);
    process.exit(1);
  }
  if (!DATE_RE.test(date)) {
    console.error(`Fecha inválida: "${date}" — usá YYYY-MM-DD`);
    process.exit(1);
  }
  if (!SLUG_RE.test(slug)) {
    console.error(`Slug inválido: "${slug}" — minúsculas, dígitos y guiones`);
    process.exit(1);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Some CDNs reject the default fetch agent; look like a browser.
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,*/*',
      },
    });
  } catch (error) {
    console.error(`❌ No se pudo descargar: ${(error as Error).message}`);
    process.exit(1);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} ${res.statusText} al descargar ${url}`);
    process.exit(1);
  }

  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (contentType && !contentType.startsWith('image/')) {
    console.error(`❌ El recurso no es una imagen (content-type: ${contentType || 'desconocido'}).`);
    process.exit(1);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const size = imageSize(buf);
  if (size && size.width <= 4 && size.height <= 4) {
    console.error(`❌ Parece un pixel de tracking (${size.width}×${size.height}px). Omitido.`);
    process.exit(1);
  }

  const urlExt = extname(new URL(url).pathname).replace('.', '').toLowerCase();
  const ext = EXT_BY_TYPE[contentType] ?? (urlExt && urlExt.length <= 4 ? urlExt : 'png');

  const dir = join(ROOT, 'public', 'editions', date, slug);
  mkdirSync(dir, { recursive: true });
  const fileName = uniqueName(dir, explicitName ?? url.split('/').pop() ?? 'figure', ext);
  writeFileSync(join(dir, fileName), buf);

  const src = `/editions/${date}/${slug}/${fileName}`;
  console.log(
    JSON.stringify(
      {
        src,
        bytes: buf.length,
        contentType: contentType || null,
        ...(size ?? {}),
        media: { type: 'image', src, alt: '', ...(size ?? {}) },
      },
      null,
      2,
    ),
  );
  if (!size) console.error('ℹ No pude detectar el tamaño; podés setear width/height a mano (opcional).');
  if (buf.length < 1024) console.error('⚠ Archivo muy chico (<1KB): puede ser un spacer/logo. Revisalo.');
}

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
