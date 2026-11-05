import Link from "next/link";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <Link className="logo" href="/">
          legalgo<i>.</i>
        </Link>
        <span>Nom, tarifs, options et données provisoires.</span>
        <span>[RAISON SOCIALE] · [SIRET] · [ADRESSE]</span>
        <Link href="/mentions-legales">Mentions légales</Link>
        <Link href="/confidentialite">Confidentialité</Link>
        <Link href="/cgu">CGU/CGV</Link>
        <Link href="/cabinet">Espace cabinet</Link>
      </div>
    </footer>
  );
}
