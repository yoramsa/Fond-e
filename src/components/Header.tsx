import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <div className="nav">
          <Link className="logo" href="/" aria-label="Légalgo, accueil">
            <Logo />
          </Link>
          <Link className="lnk hide-m" href="/#services">
            Services
          </Link>
          <Link className="lnk hide-m" href="/#plans">
            Tarifs
          </Link>
          <Link className="btn sm" href="/demarrer">
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}
