import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec">
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>{title}</h1>
            <p className="sub">Cette étape arrive dans une phase suivante du projet.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
