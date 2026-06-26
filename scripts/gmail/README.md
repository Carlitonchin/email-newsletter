# Scripts de Gmail

Dos scripts para leer tu bandeja de entrada con la **Gmail API** oficial (OAuth de
solo lectura). La idea es que más adelante un agente de IA use el detalle de cada
correo para resumir tus newsletters.

- `pnpm gmail:list` → lista los correos de las **últimas 48 h** (id, remitente, asunto, fecha, resumen).
- `pnpm gmail:get <id>` → abre un correo y muestra su contenido completo.

---

## 1. Configurar Google Cloud (una sola vez)

La Gmail API necesita credenciales OAuth tuyas. Es gratis.

1. Entra a <https://console.cloud.google.com/> y crea un proyecto (arriba a la
   izquierda → *Nuevo proyecto*).
2. Habilita la API: busca **"Gmail API"** en la barra superior (o entra a
   *APIs y servicios → Biblioteca*), ábrela y pulsa **Habilitar**.
3. Configura la pantalla de consentimiento: *APIs y servicios → Pantalla de
   consentimiento de OAuth*.
   - Tipo de usuario: **Externo**.
   - Completa nombre de la app y tu correo.
   - En **Usuarios de prueba**, agrega tu propia dirección de Gmail. (Mientras la
     app esté en modo *Testing* solo tus usuarios de prueba pueden entrar, que es
     justo lo que queremos.)
4. Crea las credenciales: *APIs y servicios → Credenciales → Crear credenciales →
   ID de cliente de OAuth*.
   - Tipo de aplicación: **Aplicación de escritorio** (Desktop app).
   - Pulsa **Crear** y luego **Descargar JSON**.
5. Guarda ese archivo descargado como:

   ```
   scripts/gmail/credentials.json
   ```

> `credentials.json` y `token.json` están en `.gitignore`. No los subas al repo.

---

## 2. Login (una sola vez)

```bash
pnpm gmail:auth
```

Se abre el navegador para que autorices el acceso de **solo lectura**. Si ves un
aviso de "app no verificada", entra en *Configuración avanzada → Ir a (tu app)*:
es tu propia app en modo testing. Al terminar se guarda `scripts/gmail/token.json`
y ya no tendrás que volver a iniciar sesión.

---

## 3. Uso

### Listar correos

```bash
pnpm gmail:list                                         # bandeja, últimas 48 h
pnpm gmail:list -- --json                               # mismas 48 h, en JSON
pnpm gmail:list -- --query "category:promotions newer_than:7d"
```

Opciones (van después de `--`):

| Opción            | Descripción                                          | Default       |
| ----------------- | ---------------------------------------------------- | ------------- |
| `-q`, `--query`   | Búsqueda estilo Gmail (reemplaza la ventana de 48 h) | últimas 48 h  |
| `-n`, `--max`     | Tope de correos a traer (pagina si hace falta)       | `500`         |
| `--json`          | Salida en JSON                                       | —             |

Sin opciones siempre trae la **bandeja de entrada de las últimas 48 horas**
(calculadas desde el momento de ejecutar). La `--query` admite la misma sintaxis
que el buscador de Gmail: `from:`, `subject:`, `label:`, `category:promotions`,
`is:unread`, `newer_than:3d`, etc.

### Ver el detalle de un correo

Copia un `id` del listado y:

```bash
pnpm gmail:get 1899abc1234def56            # cabeceras + cuerpo en texto
pnpm gmail:get 1899abc1234def56 -- --json  # todo en JSON (para un modelo de IA)
pnpm gmail:get 1899abc1234def56 -- --html  # cuerpo HTML original
```

---

## Archivos

| Archivo           | Qué hace                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `auth.ts`         | Login OAuth y cliente de Gmail reutilizable.                     |
| `message.ts`      | Helpers: leer cabeceras y extraer/limpiar el cuerpo del correo.  |
| `list-emails.ts`  | Script 1 — lista los correos.                                    |
| `get-email.ts`    | Script 2 — detalle de un correo.                                 |

## Próximo paso (IA)

`pnpm gmail:get <id> -- --json` devuelve `{ from, subject, date, text, html }`.
Ese `text` ya viene limpio: es lo que le pasarás a un modelo de Claude para que
genere el resumen de la newsletter.
