import process from 'node:process';

import { getGmailClient } from './auth.ts';
import { bestText, extractBodies, getHeader } from './message.ts';

function printHelp(): void {
  console.log(`
Abre un correo concreto y muestra su detalle (cabeceras + cuerpo).

Uso:
  pnpm gmail:get <messageId> [-- opciones]

Obtené el <messageId> con \`pnpm gmail:list\`.

Opciones:
      --json   Imprime todo el detalle como JSON (ideal para alimentar a un modelo)
      --html   Imprime el cuerpo HTML original sin convertir
  -h, --help   Muestra esta ayuda

Ejemplos:
  pnpm gmail:get 1899abc1234def56
  pnpm gmail:get 1899abc1234def56 -- --json
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }

  const json = argv.includes('--json');
  const rawHtml = argv.includes('--html');
  const id = argv.find((arg) => !arg.startsWith('-'));

  if (!id) {
    console.error('Falta el id del correo.\nUso: pnpm gmail:get <messageId>  (obtenelo con pnpm gmail:list)');
    process.exit(1);
  }

  const gmail = await getGmailClient();
  const res = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
  const message = res.data;
  const headers = message.payload?.headers;
  const bodies = extractBodies(message.payload);

  if (json) {
    console.log(
      JSON.stringify(
        {
          id: message.id,
          threadId: message.threadId,
          from: getHeader(headers, 'From'),
          to: getHeader(headers, 'To'),
          subject: getHeader(headers, 'Subject'),
          date: getHeader(headers, 'Date'),
          snippet: message.snippet ?? '',
          text: bestText(bodies),
          html: bodies.html,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (rawHtml) {
    console.log(bodies.html || '(este correo no trae cuerpo HTML)');
    return;
  }

  const divider = '─'.repeat(70);
  console.log(`\nDe:      ${getHeader(headers, 'From')}`);
  console.log(`Para:    ${getHeader(headers, 'To')}`);
  console.log(`Asunto:  ${getHeader(headers, 'Subject')}`);
  console.log(`Fecha:   ${getHeader(headers, 'Date')}`);
  console.log(`\n${divider}\n`);
  console.log(bestText(bodies) || message.snippet || '(sin contenido)');
  console.log(`\n${divider}`);
}

main().catch((err: Error) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
