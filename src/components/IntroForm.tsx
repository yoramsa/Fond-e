"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon } from "@/components/icons";
import { FORMES, FormeKey, TYPES, TypeKey } from "@/lib/data";

const URGENCES = ["Dès que possible", "Dans le mois", "Je me renseigne"];

export default function IntroForm({ initialType }: { initialType: TypeKey }) {
  const router = useRouter();
  const [type, setType] = useState<TypeKey>(initialType);
  const [forme, setForme] = useState<FormeKey>("SASU");
  const [urgence, setUrgence] = useState(URGENCES[0]);
  const f = FORMES[forme];

  return (
    <>
      <div className="opts" role="radiogroup" aria-label="Démarche">
        {(Object.keys(TYPES) as TypeKey[]).map((k) => (
          <label className="opt" key={k}>
            <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} />
            <span>
              <b>{TYPES[k].verb}</b>
              <em>{TYPES[k].desc}</em>
            </span>
          </label>
        ))}
      </div>

      {type === "creation" && (
        <div className="f" style={{ marginBottom: 0 }}>
          <label>Forme juridique</label>
          <div className="chips" role="radiogroup" aria-label="Forme juridique" style={{ marginTop: 6 }}>
            {(Object.keys(FORMES) as FormeKey[]).map((k) => (
              <label className="chip" key={k}>
                <input type="radio" name="forme" value={k} checked={forme === k} onChange={() => setForme(k)} />
                <span>{k}</span>
              </label>
            ))}
          </div>
          <p className="hint">{f.hint} Pas sûr ? Notre comptable vous conseille.</p>
        </div>
      )}

      <div className="f">
        <label htmlFor="urgence">Quand souhaitez-vous démarrer ?</label>
        <select id="urgence" value={urgence} onChange={(e) => setUrgence(e.target.value)}>
          {URGENCES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn big"
        onClick={() => router.push(`/questionnaire/${type}`)}
      >
        Commencer le questionnaire <ArrowIcon />
      </button>
    </>
  );
}
