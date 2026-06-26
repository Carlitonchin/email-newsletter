import process from 'node:process';

import type { gmail_v1 } from 'googleapis';

import { getGmailClient } from './auth.ts';
import { getHeader } from './message.ts';

interface Options {
  query: string;
  describe: string;
  max: number;
  json: boolean;
}

// Ventana fija: cada vez que corre miramos las últimas 48 horas.
const WINDOW_HOURS = 48;
// Tope de seguridad por si la ventana trae un volumen enorme de correos.
const DEFAULT_MAX = 500;
// Cuántas peticiones de detalle hacemos a la vez (evita tocar el rate limit).
const CONCURRENCY = 20;

/**
 * Búsqueda por defecto: bandeja de entrada de las últimas 48 horas. Usamos
 * `after:<epoch>` en vez de `newer_than:2d` porque Gmail solo entiende días en
 * `newer_than`, y queremos exactamente 48 horas desde el momento de ejecutar.
 */
function windowQuery(): string {
  const sinceSeconds = Math.floor((Date.now() - WINDOW_HOURS * 60 * 60 * 1000) / 1000);
  return `in:inbox after:${sinceSeconds}`;
}

function printHelp(): void {
  console.log(`
Lista los correos de tu bandeja de Gmail de las últimas ${WINDOW_HOURS} horas.

Uso:
  pnpm gmail:list [-- opciones]

Opciones:
  -q, --query <texto>   Búsqueda estilo Gmail (reemplaza la ventana de ${WINDOW_HOURS} h)
  -n, --max <número>    Tope de correos a traer (por defecto: ${DEFAULT_MAX})
      --json            Imprime el resultado como JSON
  -h, --help            Muestra esta ayuda

Ejemplos:
  pnpm gmail:list
  pnpm gmail:list -- --json
  pnpm gmail:list -- --query "category:promotions newer_than:7d"
`);
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    query: windowQuery(),
    describe: `bandeja de entrada · últimas ${WINDOW_HOURS} h`,
    max: DEFAULT_MAX,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--query' || arg === '-q') {
      const value = argv[++i];
      if (value) {
        options.query = value;
        options.describe = value;
      }
    } else if (arg === '--max' || arg === '-n') {
      options.max = Number(argv[++i]) || options.max;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  return options;
}

/** Recorre todas las páginas de resultados hasta `limit` o hasta que se acaben. */
async function listMessageIds(
  gmail: gmail_v1.Gmail,
  query: string,
  limit: number,
): Promise<Array<gmail_v1.Schema$Message & { id: string }>> {
  const collected: gmail_v1.Schema$Message[] = [];
  let pageToken: string | undefined;
  do {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(500, limit - collected.length),
      pageToken,
    });
    collected.push(...(res.data.messages ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && collected.length < limit);

  return collected
    .slice(0, limit)
    .filter((m): m is gmail_v1.Schema$Message & { id: string } => typeof m.id === 'string');
}

/** Ejecuta `fn` sobre cada item con un máximo de tareas en paralelo. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function main(): Promise<void> {
  const { query, describe, max, json } = parseArgs(process.argv.slice(2));
  const gmail = await getGmailClient();

  const messages = await listMessageIds(gmail, query, max);

  if (messages.length === 0) {
    console.log(`No hay correos para: ${describe}`);
    return;
  }

  // La API solo devuelve ids en el list; pedimos las cabeceras de cada uno
  // (format=metadata es mucho más liviano que traer el correo entero).
  const summaries = await mapWithConcurrency(messages, CONCURRENCY, async (m) => {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: m.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });
    const headers = res.data.payload?.headers;
    return {
      id: m.id,
      threadId: m.threadId ?? '',
      from: getHeader(headers, 'From'),
      subject: getHeader(headers, 'Subject'),
      date: getHeader(headers, 'Date'),
      snippet: res.data.snippet ?? '',
    };
  });

  if (json) {
    console.log(JSON.stringify(summaries, null, 2));
    return;
  }

  const divider = '─'.repeat(70);
  console.log(`\n📬 ${summaries.length} correo(s) — ${describe}\n`);
  for (const s of summaries) {
    console.log(divider);
    console.log(`  id:      ${s.id}`);
    console.log(`  de:      ${s.from}`);
    console.log(`  asunto:  ${s.subject}`);
    console.log(`  fecha:   ${s.date}`);
    console.log(`  resumen: ${s.snippet}`);
  }
  console.log(divider);
  console.log('\n👉 Para abrir un correo completo:  pnpm gmail:get <id>\n');
}

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
