import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { AddressInfo } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';

// Solo lectura: alcanza para listar y leer correos, no permite enviar ni borrar.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const GMAIL_DIR = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = join(GMAIL_DIR, 'credentials.json');
const TOKEN_PATH = join(GMAIL_DIR, 'token.json');

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

type GmailOptions = Parameters<typeof google.gmail>[0];

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

interface StoredToken extends ClientCredentials {
  refresh_token: string;
  access_token: string;
  expiry_date: number; // epoch en milisegundos
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

/** Lee client_id/secret del credentials.json descargado de Google Cloud. */
async function readClientCredentials(): Promise<ClientCredentials> {
  try {
    await access(CREDENTIALS_PATH);
  } catch {
    throw new Error(
      `No encontré ${CREDENTIALS_PATH}\n` +
        'Descarga las credenciales OAuth (tipo "Aplicación de escritorio") desde\n' +
        'Google Cloud y guárdalas en esa ruta. Los pasos están en scripts/gmail/README.md',
    );
  }
  const parsed = JSON.parse(await readFile(CREDENTIALS_PATH, 'utf-8'));
  const key = parsed.installed ?? parsed.web;
  if (!key?.client_id || !key?.client_secret) {
    throw new Error(
      'credentials.json no tiene client_id/client_secret válidos.\n' +
        '¿Descargaste el JSON del tipo "Aplicación de escritorio"?',
    );
  }
  return { clientId: key.client_id, clientSecret: key.client_secret };
}

/**
 * Hace el POST a la API de tokens de Google con el módulo `https` nativo en vez
 * de gaxios/fetch (undici). Esto evita el error "Premature close" que undici
 * provoca en algunas redes al intercambiar o refrescar el token.
 */
function postToken(form: Record<string, string>): Promise<TokenResponse> {
  const body = new URLSearchParams(form).toString();
  return new Promise((resolveToken, rejectToken) => {
    const req = httpsRequest(
      TOKEN_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 20_000,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json: { error?: string; error_description?: string } & Partial<TokenResponse>;
          try {
            json = JSON.parse(data);
          } catch {
            rejectToken(new Error(`Respuesta inesperada de Google (HTTP ${res.statusCode}).`));
            return;
          }
          const status = res.statusCode ?? 0;
          if (status >= 200 && status < 300 && json.access_token) {
            resolveToken(json as TokenResponse);
          } else {
            rejectToken(new Error(json.error_description ?? json.error ?? `HTTP ${status}`));
          }
        });
      },
    );
    req.on('error', rejectToken);
    req.on('timeout', () => req.destroy(new Error('se agotó el tiempo conectando con Google')));
    req.write(body);
    req.end();
  });
}

function buildAuthUrl(clientId: string, redirectUri: string): string {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  return url.toString();
}

/** Abre la URL en el navegador del sistema (sin pasar por el shell). */
function openBrowser(url: string): void {
  if (process.platform === 'darwin') execFile('open', [url], () => {});
  else if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', url], () => {});
  else execFile('xdg-open', [url], () => {});
}

const PAGE_STYLE = 'font-family:system-ui,sans-serif;text-align:center;padding:48px';
const SUCCESS_HTML = `<!doctype html><meta charset="utf-8"><body style="${PAGE_STYLE}"><h1>✅ Listo</h1><p>Autorización completada. Ya puedes cerrar esta pestaña y volver a la terminal.</p></body>`;
const ERROR_HTML = `<!doctype html><meta charset="utf-8"><body style="${PAGE_STYLE}"><h1>⚠️ Algo salió mal</h1><p>Revisa la terminal para ver el detalle.</p></body>`;

/**
 * Levanta un servidor local, abre el navegador para el consentimiento y captura
 * el código que Google envía de vuelta. Le respondemos al navegador de inmediato
 * para que no quede colgado (el "Safari no puede conectar" del flujo anterior).
 */
function getAuthorizationCode(clientId: string): Promise<{ code: string; redirectUri: string }> {
  return new Promise((resolveCode, rejectCode) => {
    const server = createServer();

    const timeout = setTimeout(
      () => {
        server.close();
        rejectCode(new Error('Se agotó el tiempo de espera para autorizar (5 minutos).'));
      },
      5 * 60 * 1000,
    );

    const finish = (action: () => void): void => {
      clearTimeout(timeout);
      server.close();
      action();
    };

    server.on('error', (err) => finish(() => rejectCode(err)));

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      const redirectUri = `http://localhost:${port}`;
      const authUrl = buildAuthUrl(clientId, redirectUri);

      console.log('\n🔐 Abriendo el navegador para autorizar el acceso de solo lectura…');
      console.log('   Si no se abre solo, copia y pega esta URL en tu navegador:\n');
      console.log(`   ${authUrl}\n`);
      openBrowser(authUrl);

      server.on('request', (req, res) => {
        const reqUrl = new URL(req.url ?? '/', redirectUri);
        const code = reqUrl.searchParams.get('code');
        const error = reqUrl.searchParams.get('error');

        // Ignoramos peticiones que no son el redirect (p.ej. /favicon.ico).
        if (!code && !error) {
          res.writeHead(204);
          res.end();
          return;
        }

        res.writeHead(error ? 400 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(error ? ERROR_HTML : SUCCESS_HTML);

        if (error) {
          finish(() => rejectCode(new Error(`Google devolvió un error de autorización: ${error}`)));
        } else {
          finish(() => resolveCode({ code: code as string, redirectUri }));
        }
      });
    });
  });
}

/** Flujo interactivo completo: navegador → código → token → token.json. */
async function runInteractiveAuth(): Promise<void> {
  const { clientId, clientSecret } = await readClientCredentials();
  const { code, redirectUri } = await getAuthorizationCode(clientId);

  const tokens = await postToken({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  if (!tokens.refresh_token) {
    throw new Error(
      'Google no devolvió un refresh_token. Revoca el acceso de la app en\n' +
        'https://myaccount.google.com/permissions y vuelve a ejecutar pnpm gmail:auth.',
    );
  }

  const stored: StoredToken = {
    clientId,
    clientSecret,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    expiry_date: Date.now() + tokens.expires_in * 1000,
  };
  await writeFile(TOKEN_PATH, JSON.stringify(stored, null, 2));
}

/** Lee el token guardado o pide autenticarse. */
async function readStoredToken(): Promise<StoredToken> {
  try {
    return JSON.parse(await readFile(TOKEN_PATH, 'utf-8')) as StoredToken;
  } catch {
    throw new Error('No estás autenticado todavía. Ejecuta primero:  pnpm gmail:auth');
  }
}

/** Devuelve un access_token válido, refrescándolo con https nativo si expiró. */
async function getValidAccessToken(): Promise<string> {
  const token = await readStoredToken();
  const margin = 5 * 60 * 1000;
  if (token.expiry_date - margin > Date.now()) return token.access_token;

  const refreshed = await postToken({
    client_id: token.clientId,
    client_secret: token.clientSecret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  const updated: StoredToken = {
    ...token,
    access_token: refreshed.access_token,
    expiry_date: Date.now() + refreshed.expires_in * 1000,
  };
  await writeFile(TOKEN_PATH, JSON.stringify(updated, null, 2));
  return refreshed.access_token;
}

/** Cliente de Gmail ya autorizado, listo para usar en los demás scripts. */
export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const accessToken = await getValidAccessToken();
  const auth = new google.auth.OAuth2();
  // Solo seteamos el access_token: así googleapis nunca intenta refrescar por su
  // cuenta (lo hacemos nosotros con https nativo en getValidAccessToken).
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth } as unknown as GmailOptions);
}

// `pnpm gmail:auth` ejecuta este archivo directamente para el login inicial.
const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  runInteractiveAuth()
    .then(() => console.log('✅ Autorización completada. Se guardó scripts/gmail/token.json'))
    .catch((err: Error) => {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    });
}
