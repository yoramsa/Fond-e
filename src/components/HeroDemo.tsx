"use client";

import { useEffect, useRef, useState } from "react";
import { FORMES, FormeKey } from "@/lib/data";

function Filled({ text, fresh }: { text: string; fresh: boolean }) {
  return <span className={`fv${fresh ? " fresh" : ""}`}>{text}</span>;
}
function Blank({ width = 8 }: { width?: number }) {
  return <span className="bl" style={{ minWidth: `${width}ch` }} />;
}

export default function HeroDemo() {
  const [nom, setNom] = useState("");
  const [forme, setForme] = useState<FormeKey>("SASU");
  const wasFilled = useRef(false);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const filled = nom.trim().length > 0;
    if (filled && !wasFilled.current) {
      setFresh(true);
      const t = setTimeout(() => setFresh(false), 700);
      wasFilled.current = true;
      return () => clearTimeout(t);
    }
    wasFilled.current = filled;
  }, [nom]);

  const f = FORMES[forme];
  const nm = nom.trim();

  return (
    <div className="sheet" aria-label="Essayez : aperçu de vos statuts">
      <div className="paper">
        <div className="try">
          <label htmlFor="heroName" className="dl">
            Essayez avec le nom de votre société
          </label>
          <input
            id="heroName"
            className="nameIn"
            placeholder="Nom de votre société"
            autoComplete="off"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <div className="chips" role="radiogroup" aria-label="Forme juridique">
            {(Object.keys(FORMES) as FormeKey[]).map((k) => (
              <label className="chip" key={k}>
                <input
                  type="radio"
                  name="forme"
                  value={k}
                  checked={forme === k}
                  onChange={() => setForme(k)}
                />
                <span>{k}</span>
              </label>
            ))}
          </div>
          <p className="hint">{f.hint}</p>
        </div>
        <div>
          <div className="pt">
            Statuts{!nm && " de la société"}{" "}
            {nm && <Filled text={nm} fresh={fresh} />}
          </div>
          <p>
            <b>Article 1</b>La société est une {f.long}
            {nm ? "" : ", dénommée "}
            {!nm && <Blank width={16} />}.
          </p>
          <p>
            <b>Article 2</b>Elle a pour objet <Blank width={22} />.
          </p>
          <p>
            <b>Article 3</b>Son siège est fixé <Blank width={20} />.
          </p>
          <p>
            <b>Article 4</b>Son capital est de <Filled text="1 000 €" fresh={false} />,{" "}
            {f.uni ? "détenu par un associé unique" : <Filled text="1 associés" fresh={false} />}.
          </p>
          <p>
            <b>Article 5</b>Elle est dirigée par <Blank width={16} />, {f.dir.toLowerCase()}.
          </p>
          <p>
            <b>Article 6</b>Sa durée est de 99 ans. L’exercice social se clôture le{" "}
            <Filled text="31 décembre" fresh={false} />.
          </p>
        </div>
      </div>
    </div>
  );
}
