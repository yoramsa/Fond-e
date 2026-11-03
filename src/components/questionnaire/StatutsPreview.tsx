import { FORMES, FormeKey, TypeKey, eur } from "@/lib/data";
import { Associe, DraftData, dirigeantNomCalcule, siegeTexte } from "@/lib/questionnaire";

function Filled({ text }: { text: string }) {
  return <span className="fv">{text}</span>;
}
function Blank({ width = 8 }: { width?: number }) {
  return <span className="bl" style={{ minWidth: `${width}ch` }} />;
}

function CreationPreview({
  forme,
  data,
  associes,
}: {
  forme: FormeKey;
  data: DraftData;
  associes: Associe[];
}) {
  const f = FORMES[forme];
  const nom = data.nom.trim();
  const activite = data.activite.trim();
  const siege = siegeTexte(data);
  const capital = Number(data.capital) > 0 ? Number(data.capital) : null;
  const dirigeant = dirigeantNomCalcule(data, associes);

  return (
    <>
      <div className="pt">Statuts{!nom && " de la société"} {nom && <Filled text={nom} />}</div>
      <p>
        <b>Article 1</b>La société est une {f.long}
        {nom ? "" : ", dénommée "}
        {!nom && <Blank width={16} />}.
      </p>
      <p>
        <b>Article 2</b>Elle a pour objet {activite ? <Filled text={activite.slice(0, 110)} /> : <Blank width={22} />}.
      </p>
      <p>
        <b>Article 3</b>Son siège est fixé {siege ? <Filled text={siege} /> : <Blank width={20} />}.
      </p>
      <p>
        <b>Article 4</b>Son capital est de {capital ? <Filled text={eur(capital)} /> : <Blank width={8} />}
        {", "}
        {f.uni ? (
          "détenu par un associé unique"
        ) : (
          <Filled text={`réparti entre ${associes.length} associés`} />
        )}
        .
      </p>
      <p>
        <b>Article 5</b>Elle est dirigée par {dirigeant ? <Filled text={dirigeant} /> : <Blank width={16} />},{" "}
        {f.dir.toLowerCase()}.
      </p>
      <p>
        <b>Article 6</b>Sa durée est de 99 ans. L’exercice social se clôture le{" "}
        <Filled text={data.cloture} />.
      </p>
    </>
  );
}

function ModificationPreview({ data }: { data: DraftData }) {
  const nom = data.nom.trim();
  return (
    <>
      <div className="pt">Demande de modification</div>
      <p>
        <b>Société</b>
        {nom ? <Filled text={nom + (data.siren ? ` (SIREN ${data.siren})` : "")} /> : <Blank width={14} />}
      </p>
      <p>
        <b>Nature</b>
        <Filled text={data.nature} />
      </p>
      <p>
        <b>Détails</b>
        {data.details.trim() ? <Filled text={data.details.trim().slice(0, 90)} /> : <Blank width={16} />}
      </p>
      <p>
        <b>Souhaitée le</b>
        {data.dateEffet ? <Filled text={data.dateEffet} /> : <Blank width={10} />}
      </p>
    </>
  );
}

function FermeturePreview({ data }: { data: DraftData }) {
  const nom = data.nom.trim();
  return (
    <>
      <div className="pt">Demande de dissolution</div>
      <p>
        <b>Société</b>
        {nom ? <Filled text={nom + (data.siren ? ` (SIREN ${data.siren})` : "")} /> : <Blank width={14} />}
      </p>
      <p>
        <b>Motif</b>
        <Filled text={data.motif} />
      </p>
      <p>
        <b>Effet au</b>
        {data.dateEffet ? <Filled text={data.dateEffet} /> : <Blank width={10} />}
      </p>
    </>
  );
}

export default function StatutsPreview({
  type,
  forme,
  data,
  associes,
}: {
  type: TypeKey;
  forme: FormeKey;
  data: DraftData;
  associes: Associe[];
}) {
  return (
    <div className="sheet" aria-label="Aperçu de vos statuts">
      <div className="paper docv">
        {type === "creation" && <CreationPreview forme={forme} data={data} associes={associes} />}
        {type === "modification" && <ModificationPreview data={data} />}
        {type === "fermeture" && <FermeturePreview data={data} />}
      </div>
    </div>
  );
}
