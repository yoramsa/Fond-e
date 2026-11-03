import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignOutButton from "@/components/auth/SignOutButton";

export default function MonDossierPage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec">
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Votre espace</h1>
            <p className="sub">
              Vous êtes connecté. Le questionnaire et le suivi détaillé arrivent dans les phases
              suivantes.
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
