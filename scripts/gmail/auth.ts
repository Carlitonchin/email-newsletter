import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';

// Solo lectura: alcanza para listar y leer correos, no permite enviar ni borrar.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const GMAIL_DIR = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = join(GMAIL_DIR, 'credentials.json');
const TOKEN_PATH = join(GMAIL_DIR, 'token.json');

/**
 * `googleapis` y `@google-cloud/local-auth` arrastran versiones distintas de
 * google-auth-library. Sus clientes OAuth se comportan igual en runtime, pero
 * TypeScript los ve como tipos incompatibles (propiedades privadas distintas).
 * Para no pelear con eso usamos aquí un tipo estructural mínimo y casteamos en
 * las pocas fronteras donde se cruzan las versiones.
 */
interface OAuthClient {
  credentials: { refresh_token?: string | null };
}

type GmailOptions = Parameters<typeof google.gmail>[0];

/** Carga el token guardado (si existe) para no repetir el login cada vez. */
async function loadSavedCredentialsIfExist(): Promise<OAuthClient | null> {
  try {
    const content = await readFile(TOKEN_PATH, 'utf-8');
    return google.auth.fromJSON(JSON.parse(content)) as unknown as OAuthClient;
  } catch {
    return null;
  }
}

/** Guarda el refresh_token en token.json tras el primer login exitoso. */
async function saveCredentials(client: OAuthClient): Promise<void> {
  const content = await readFile(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed ?? keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await writeFile(TOKEN_PATH, payload);
}

/**
 * Devuelve un cliente OAuth autorizado. La primera vez abre el navegador para
 * pedir consentimiento; después reutiliza el token guardado en token.json.
 */
async function authorize(): Promise<OAuthClient> {
  const saved = await loadSavedCredentialsIfExist();
  if (saved) return saved;

  try {
    await access(CREDENTIALS_PATH);
  } catch {
    throw new Error(
      `No encontré ${CREDENTIALS_PATH}\n` +
        'Descarga las credenciales OAuth (tipo "Desktop app") desde Google Cloud y\n' +
        'guárdalas en esa ruta. Los pasos están en scripts/gmail/README.md',
    );
  }

  const client = (await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  })) as unknown as OAuthClient;

  if (client.credentials.refresh_token) {
    await saveCredentials(client);
  }
  return client;
}

/** Cliente de Gmail ya autorizado, listo para usar en los demás scripts. */
export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const auth = await authorize();
  return google.gmail({ version: 'v1', auth } as unknown as GmailOptions);
}

// Permite ejecutar este archivo directamente (`pnpm gmail:auth`) para hacer el
// login inicial y generar token.json sin tener que listar correos.
const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  authorize()
    .then(() => console.log('✅ Autorización completada. Se guardó scripts/gmail/token.json'))
    .catch((err: Error) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
