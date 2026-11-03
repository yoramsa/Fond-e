import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MfaGate from "@/components/auth/MfaGate";

export const dynamic = "force-dynamic";

export default function CabinetVerificationPage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="intro" style={{ gridTemplateColumns: "1fr", maxWidth: 480 }}>
            <div className="introL">
              <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Double authentification</h1>
              <MfaGate />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
