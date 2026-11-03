import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignOutButton from "@/components/auth/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export default async function CabinetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("cabinet_members")
    .select("full_name, role")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec">
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>
              Bonjour {member?.full_name ?? ""}
            </h1>
            <p className="sub">
              {member?.role === "admin" ? "Compte administrateur." : "Compte agent."} Le tableau
              de bord des dossiers arrive en phase 6.
            </p>
            <div style={{ marginTop: 24 }}>
              <SignOutButton />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
