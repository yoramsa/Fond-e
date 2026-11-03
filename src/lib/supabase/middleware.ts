import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./env";

const CABINET_PUBLIC_PATHS = ["/cabinet/connexion", "/cabinet/verification"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
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

  // Rafraîchit la session (obligatoire : ne jamais retirer cet appel,
  // c'est lui qui renouvelle le cookie de session côté serveur).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/cabinet") && !CABINET_PUBLIC_PATHS.includes(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/cabinet/connexion", request.url));
    }

    const { data: isCabinetMember } = await supabase.rpc("is_cabinet_member");
    if (!isCabinetMember) {
      return NextResponse.redirect(new URL("/cabinet/connexion", request.url));
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return NextResponse.redirect(new URL("/cabinet/verification", request.url));
    }
  }

  if (pathname.startsWith("/mon-dossier") && !user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  return response;
}
