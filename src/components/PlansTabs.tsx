"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, PRIX, TYPES, TypeKey } from "@/lib/data";

export default function PlansTabs() {
  const [type, setType] = useState<TypeKey>("creation");

  return (
    <>
      <div className="tabs" role="group" aria-label="Type de démarche">
        {(Object.keys(TYPES) as TypeKey[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={type === k}
            onClick={() => setType(k)}
          >
            {TYPES[k].label}
          </button>
        ))}
      </div>
      <div className="plans">
        {PLANS.map((p, i) => (
          <article className={`plan${p.rec ? " rec" : ""}`} key={p.n}>
            {p.rec && <span className="tag">Recommandée</span>}
            <h3>{p.n}</h3>
            <div className="price">
              {PRIX[type][i] === 0 ? "0 €" : `${PRIX[type][i]} €`} <small>HT</small>
            </div>
            <p className="fees">
              {type === "creation" ? "+ frais officiels, environ 200 €" : "+ frais officiels"}
            </p>
            <ul>
              {p.f.map((x) => (
                <li key={x} className={x.endsWith(":") ? "lead" : ""}>
                  {x}
                </li>
              ))}
            </ul>
            <Link className={`btn${p.rec ? "" : " alt"}`} href={`/demarrer/${type}`}>
              Choisir {p.n}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
