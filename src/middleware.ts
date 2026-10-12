import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function configError(message: string) {
  return new NextResponse(message, { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export async function middleware(request: NextRequest) {
  // Las variables NEXT_PUBLIC_* se incrustan al compilar: si faltan, hay que cargarlas en Vercel y volver a publicar.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = [!SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL", !SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
      .filter(Boolean)
      .join(", ");
    return configError(
      `Configuración incompleta del sitio: falta ${missing} en las variables de entorno (Production) de Vercel. ` +
        "Después de cargarla hay que volver a publicar (Redeploy).",
    );
  }

  let response = NextResponse.next({ request });
  let user = null;
  let isAdmin = false;
  const path = request.nextUrl.pathname;
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    ({
      data: { user },
    } = await supabase.auth.getUser());
    // Segunda barrera para /admin (cada página también llama a requireAdmin()).
    if (user && path.startsWith("/admin")) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      isAdmin = profile?.role === "admin";
    }
  } catch (e) {
    console.error("middleware supabase", e);
    return configError(
      "No se pudo iniciar la conexión con Supabase. Revisá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel: " +
        (e instanceof Error ? e.message : String(e)),
    );
  }

  if (!user && (path.startsWith("/panel") || path.startsWith("/admin") || path.startsWith("/comprar"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (user && path.startsWith("/admin") && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/pagopar|api/salud|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
