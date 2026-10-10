# Instituto Shema — Campus online

Escuela bíblica online de la **Congregación Shema Israel (Paraguay)** — Pastor presidente **Félix Guerrero**.

Sitio en producción: <https://institutoshema.vercel.app> (Vercel publica automáticamente la rama `main`).

- Venta de **libros digitales** (PDF/EPUB con descarga privada para compradores).
- Venta de **cursos online** con módulos, clases grabadas, en YouTube o en vivo.
- **Registro de asistencia** por clase:
  - Video: se cuentan sólo los segundos realmente reproducidos (adelantar no suma) y el servidor limita lo acreditado al tiempo real transcurrido. Asistencia = 90% de la clase.
  - Control de presencia "¿Seguís ahí?" cada 8–15 minutos de reproducción.
  - Clases en vivo: código de asistencia que el profesor dicta durante la clase.
  - Marcado manual desde la administración.
- **Examen por módulo** (opción múltiple, nota mínima e intentos configurables). Las respuestas correctas nunca llegan al navegador.
- **Certificado PDF** automático con código y QR de verificación pública (`/verificar`).
- **Pagos**: Pagopar (tarjetas, billeteras, bocas de cobranza) y transferencia bancaria con comprobante + aprobación del administrador.
- **Panel del alumno**: cursos y avance, libros, compras, certificados, perfil.
- **Panel de administración**: ventas, pedidos (aprobar/rechazar), libros, cursos, módulos, clases (subida de videos), exámenes, asistencia y notas por alumno, certificados, alta manual de accesos.

Todo el sitio está en español (Paraguay), montos en guaraníes y horarios en hora de Paraguay (UTC-3).

## Tecnología

- [Next.js 15](https://nextjs.org) (App Router) + Tailwind CSS
- [Supabase](https://supabase.com): base de datos Postgres, login de usuarios y almacenamiento de archivos
- [Pagopar](https://www.pagopar.com) para cobros en Paraguay
- Hosting recomendado: [Vercel](https://vercel.com)

## Puesta en marcha

### 1. Supabase

1. Crear un proyecto en <https://supabase.com> (región São Paulo, la más cercana).
2. **SQL Editor → New query**: pegar y ejecutar, en orden, `supabase/migrations/20261010000000_init.sql` y `supabase/migrations/20261010180045_hardening.sql` (o usar `supabase db push` con la CLI).
3. (Opcional) ejecutar `supabase/seed.sql` para cargar los dos libros y un curso de ejemplo (quedan como borrador).
4. **Authentication → URL Configuration**:
   - Site URL: `https://tu-dominio.com.py`
   - Redirect URLs: `https://tu-dominio.com.py/auth/callback`
5. (Recomendado) **Authentication → Email Templates**: traducir los correos al español.

### 2. Variables de entorno

Copiar `.env.example` a `.env.local` (o cargarlas en Vercel) y completar:

| Variable | Dónde se obtiene |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**secreta**) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |
| `PAGOPAR_PUBLIC_KEY`, `PAGOPAR_PRIVATE_KEY` | Panel de comercio de Pagopar (si se dejan vacías sólo se ofrece transferencia) |
| `NEXT_PUBLIC_BANK_INFO` | Datos de la cuenta bancaria que ve el alumno |
| `NEXT_PUBLIC_WHATSAPP` | Número de contacto (formato `595981…`) |

### 3. Ejecutar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compilación de producción
```

### Probar todo en tu computadora (sin cuenta de Supabase)

Requisitos: [Node.js 20+](https://nodejs.org) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
npm install
npm run db:start      # levanta Supabase local y aplica la base + datos de ejemplo
```

Al terminar, el comando muestra `API URL`, `anon key` y `service_role key`. Crear `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Luego `npm run dev` y abrir <http://localhost:3000>. Registrarse en el sitio y, en Supabase Studio
(<http://127.0.0.1:54323> → SQL Editor), convertir esa cuenta en administrador:

```sql
update public.profiles set role = 'admin' where email = 'tu@correo.com';
```

Para apagar: `npm run db:stop`. Para borrar todo y empezar de cero: `npm run db:reset`.

### 4. Primer administrador

Registrarse en el sitio con el correo del administrador y luego, en el SQL Editor de Supabase:

```sql
update public.profiles set role = 'admin' where email = 'correo@ejemplo.com';
```

Desde **Administración → Alumnos** se puede dar o quitar el rol de administrador a otros usuarios.

### 5. Pagopar

1. Registrar el comercio en Pagopar y obtener las claves pública y privada.
2. En el panel de Pagopar configurar:
   - **URL de respuesta (webhook)**: `https://tu-dominio.com.py/api/pagopar/webhook`
   - **URL de redirección**: `https://tu-dominio.com.py/pago/resultado?hash=($hash)`
3. Hacer una compra de prueba en el entorno de pruebas de Pagopar antes de habilitar en producción.

## Uso diario (administración)

1. **Libros** → editar título, precio, descripción, subir portada y PDF → marcar *Publicado*.
2. **Cursos** → crear curso → agregar módulos → en cada módulo agregar clases y preguntas del examen → *Publicado*.
3. **Clases**: subir el video (MP4), pegar un enlace de YouTube no listado, o configurar una clase en vivo (fecha, enlace de Zoom/Meet y código de asistencia).
4. **Pedidos y pagos**: revisar comprobantes de transferencia y aprobar → el alumno recibe acceso al instante. También se puede habilitar acceso manual (efectivo, becas).
5. **Cursos → Asistencia y notas**: planilla de asistencia y notas por alumno; clic en una celda para marcar asistencia manual.

### Tamaño de los videos

El plan gratuito de Supabase permite archivos de hasta **50 MB**. Para clases largas:
usar el plan Pro de Supabase (permite videos grandes; la subida es reanudable) o subir el video
a YouTube como **no listado** y pegar el enlace en la clase.

## Estructura

```
supabase/migrations/   esquema de base de datos y reglas de seguridad (RLS)
src/app/               páginas (público, (auth), panel/, admin/, api/)
src/lib/               lógica: auth, pedidos, Pagopar, avance académico
src/components/        componentes (reproductor con asistencia, subida de archivos…)
public/                logos (Instituto Shema y Congregación)
```
