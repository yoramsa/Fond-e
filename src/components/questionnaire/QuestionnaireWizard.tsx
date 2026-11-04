"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon } from "@/components/icons";
import { FORMES, FormeKey, NEED_BEFORE, OPTS, PLANS, PRIX, TYPES, TypeKey, eur } from "@/lib/data";
import {
  Associe,
  DraftData,
  MAX_LEN,
  QuestionnaireDraft,
  apportSum,
  freshAssocie,
  freshQuestionnaire,
  progressPct,
  recapLines,
  sanitizeCodePostal,
  sanitizeTelephone,
  validateStep,
} from "@/lib/questionnaire";
import { createClient } from "@/lib/supabase/client";
import { loadDraftDossier, saveDraftDossier, submitDossier } from "@/app/questionnaire/actions";
import { checkNomSociete, checkSiren } from "@/app/questionnaire/entreprise-actions";
import StatutsPreview from "./StatutsPreview";

function storageKey(type: TypeKey) {
  return `fondee:questionnaire:${type}`;
}

// Un brouillon (local ou serveur) ne doit jamais faire repartir
// l'utilisateur plus loin que ce que ses données valident réellement —
// sinon l'étape affichée « saute » des champs jamais remplis (brouillon
// d'une version antérieure du questionnaire, données incomplètes, etc).
function clampStep(type: TypeKey, draft: QuestionnaireDraft): number {
  const steps = TYPES[type].steps;
  let resumeStep = 0;
  for (let i = 0; i < Math.min(draft.step, steps.length - 1); i++) {
    if (validateStep(type, steps[i], draft.forme, draft.data, draft.associes)) break;
    resumeStep = i + 1;
  }
  return resumeStep;
}

function loadDraft(type: TypeKey): QuestionnaireDraft {
  if (typeof window === "undefined") return freshQuestionnaire();
  try {
    const raw = window.localStorage.getItem(storageKey(type));
    if (!raw) return freshQuestionnaire();
    const parsed = JSON.parse(raw);
    const fresh = freshQuestionnaire();
    const merged: QuestionnaireDraft = {
      ...fresh,
      ...parsed,
      data: { ...fresh.data, ...parsed.data, opts: { ...fresh.data.opts, ...parsed.data?.opts } },
      associes: Array.isArray(parsed.associes) && parsed.associes.length > 0 ? parsed.associes : fresh.associes,
    };
    merged.step = clampStep(type, merged);
    return merged;
  } catch {
    return freshQuestionnaire();
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="f">
      <label>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="chk">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export default function QuestionnaireWizard({ type }: { type: TypeKey }) {
  const router = useRouter();
  const steps = TYPES[type].steps;
  const [draft, setDraft] = useState<QuestionnaireDraft>(() => freshQuestionnaire());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "submitting" | "error" | "done">("idle");
  const [doneInfo, setDoneInfo] = useState<{ ref: string; docBase64?: string; docFilename?: string } | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [sirenCheck, setSirenCheck] = useState<
    { status: "idle" | "checking" | "ok" | "not_found" | "error"; nom?: string }
  >({ status: "idle" });
  const [similarNames, setSimilarNames] = useState<string[]>([]);
  const loaded = useRef(false);

  // Le brouillon local (s'il existe) n'est repris qu'après le premier
  // rendu client, pour que le HTML initial corresponde à celui du serveur.
  // Si le client est déjà connecté (il reprend une démarche commencée
  // plus tôt), le brouillon serveur prévaut sur le brouillon local.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadDraft(type);
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsAuthed(!!userData.user);

      if (userData.user) {
        const serverDraft = await loadDraftDossier(type);
        if (!cancelled && serverDraft) {
          const merged = { ...local, forme: serverDraft.forme, data: serverDraft.data };
          merged.step = clampStep(type, merged);
          setDraft(merged);
          loaded.current = true;
          return;
        }
      }
      if (!cancelled) {
        setDraft(local);
        loaded.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (!loaded.current) return;
    window.localStorage.setItem(storageKey(type), JSON.stringify(draft));
  }, [draft, type]);

  // Brouillon serveur : enregistrement incrémental pour un client déjà
  // connecté (le jsonb `dossiers.draft`), indépendant de la soumission
  // finale. Les clients anonymes ne gardent que le brouillon local,
  // synchronisé au serveur une fois connectés (voir DraftSync).
  useEffect(() => {
    if (!loaded.current || !isAuthed) return;
    const t = setTimeout(() => {
      saveDraftDossier({ type, forme: draft.forme, data: draft.data }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.forme, draft.data, type, isAuthed]);

  const { forme, step, data, associes } = draft;
  const stepKey = steps[step];
  const f = FORMES[forme];

  // Vérifie le SIREN auprès du registre officiel (API gouv.fr) dès qu'il
  // comporte 9 chiffres, pour confirmer que la société existe vraiment
  // avant de continuer (modification/fermeture).
  useEffect(() => {
    if (stepKey !== "Votre société") return;
    if (!/^\d{9}$/.test(data.siren)) {
      setSirenCheck({ status: "idle" });
      return;
    }
    let cancelled = false;
    setSirenCheck({ status: "checking" });
    const t = setTimeout(async () => {
      const result = await checkSiren(data.siren);
      if (cancelled) return;
      if (result.status === "ok") {
        setSirenCheck({ status: "ok", nom: result.nom });
        setDraft((d) => (d.data.nom.trim() ? d : { ...d, data: { ...d.data, nom: result.nom } }));
      } else {
        setSirenCheck({ status: result.status });
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.siren, stepKey]);

  // Avertit (sans bloquer) si une société active porte déjà exactement
  // ce nom — la disponibilité définitive est vérifiée par le greffe.
  useEffect(() => {
    if (stepKey !== "Société" || type !== "creation") return;
    if (data.nom.trim().length < 3) {
      setSimilarNames([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { matches } = await checkNomSociete(data.nom.trim());
      if (!cancelled) setSimilarNames(matches);
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.nom, stepKey, type]);

  function updateData(patch: Partial<DraftData>) {
    setDraft((d) => ({ ...d, data: { ...d.data, ...patch } }));
  }
  function updateAssocie(i: number, patch: Partial<Associe>) {
    setDraft((d) => ({
      ...d,
      associes: d.associes.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));
  }
  function addAssocie() {
    setDraft((d) => ({ ...d, associes: [...d.associes, freshAssocie()] }));
  }
  function removeAssocie(i: number) {
    setDraft((d) => ({ ...d, associes: d.associes.filter((_, idx) => idx !== i) }));
  }

  function goBack() {
    setError(null);
    setDraft((d) => ({ ...d, step: Math.max(0, d.step - 1) }));
  }

  async function goNext() {
    const err = validateStep(type, stepKey, forme, data, associes);
    if (err) {
      setError(err);
      return;
    }

    if (stepKey === "Votre société") {
      if (sirenCheck.status === "checking") {
        setError("Vérification du SIREN en cours…");
        return;
      }
      if (sirenCheck.status === "not_found") {
        setError("Aucune société active trouvée avec ce SIREN. Vérifiez le numéro.");
        return;
      }
      if (sirenCheck.status === "error") {
        setError("Impossible de vérifier ce SIREN pour l’instant. Réessayez dans un instant.");
        return;
      }
      if (sirenCheck.status !== "ok") {
        setError("Le SIREN doit être vérifié avant de continuer.");
        return;
      }
    }

    setError(null);

    if (step < steps.length - 1) {
      setDraft((d) => ({ ...d, step: d.step + 1 }));
      return;
    }

    await handleSubmit();
  }

  async function handleSubmit() {
    setStatus("submitting");
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      const result = await submitDossier({ type, forme, data, associes });
      if (result.ok) {
        window.localStorage.removeItem(storageKey(type));
        setDoneInfo({ ref: result.ref, docBase64: result.docBase64, docFilename: result.docFilename });
        setStatus("done");
        return;
      }
      setStatus("error");
      setError(result.needsAuth ? "Votre session a expiré, reconnectez-vous." : result.message);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/mon-dossier` },
    });
    if (otpError) {
      setStatus("error");
      setError("Impossible d’envoyer le lien de connexion. Vérifiez l’adresse e-mail.");
      return;
    }
    setStatus("sent");
  }

  const apports = useMemo(() => apportSum(associes), [associes]);
  const capital = Number(data.capital) || 0;
  const pct = useMemo(() => progressPct(type, data, associes), [type, data, associes]);

  if (status === "done" && doneInfo) {
    return (
      <div className="wrap">
        <section className="sec">
          <h1 style={{ fontSize: "clamp(2rem,5vw,2.6rem)" }}>Merci !</h1>
          <p className="sub">
            Votre dossier <b>{doneInfo.ref}</b> a bien été reçu. Un expert-comptable va le relire et nous
            vous contacterons très prochainement.
          </p>
          <p className="sub">
            Une question avant ça ? Contactez-nous, nous sommes disponibles par téléphone.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a className="btn big" href="tel:067777777">
              Nous appeler au 06 77 77 77 7
            </a>
            <button type="button" className="btn alt" onClick={() => router.push("/mon-dossier")}>
              Aller à mon espace
            </button>
          </div>

          {doneInfo.docBase64 && doneInfo.docFilename && (
            <p className="sub" style={{ marginTop: 24 }}>
              <a
                href={`data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${doneInfo.docBase64}`}
                download={doneInfo.docFilename}
              >
                Télécharger les statuts générés
              </a>{" "}
              (lien temporaire, pour les tests uniquement)
            </p>
          )}
        </section>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="wrap">
        <section className="sec">
          <h1 style={{ fontSize: "clamp(2rem,5vw,2.6rem)" }}>Votre dossier est prêt</h1>
          <p className="sub">
            Un lien de connexion vient d’être envoyé à <b>{data.email}</b>. Ouvrez-le pour créer votre
            espace et finaliser l’envoi de votre dossier « {data.nom || steps[0]} ».
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="flow">
        <div className="fpanel">
          <div className="stepbar" role="list" aria-label="Étapes">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`st${i === step ? " on" : i < step ? " done" : ""}`}
                role="listitem"
                title={s}
                aria-current={i === step ? "step" : undefined}
              >
                <i>{i < step ? "✓" : i + 1}</i>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${pct}%` }} />
          </div>
          <p className="hint">{pct} % du dossier rempli</p>

          <div className="fbody">
            {stepKey === "Société" && (
              <>
                <h2>Parlons de votre société</h2>
                <p className="sub">Ces informations alimentent vos statuts, que vous voyez se remplir.</p>
                <div className="f" style={{ marginBottom: 20 }}>
                  <label>Forme juridique</label>
                  <div className="chips" role="radiogroup" aria-label="Forme juridique">
                    {(Object.keys(FORMES) as FormeKey[]).map((k) => (
                      <label className="chip" key={k}>
                        <input
                          type="radio"
                          name="forme"
                          checked={forme === k}
                          onChange={() => setDraft((d) => ({ ...d, forme: k }))}
                        />
                        <span>{k}</span>
                      </label>
                    ))}
                  </div>
                  <small>{f.hint}</small>
                </div>
                <Field
                  label="Nom de la société"
                  hint={
                    similarNames.length > 0
                      ? `⚠ Une société « ${similarNames[0]} » existe déjà — vérifiez qu’il ne s’agit pas d’un conflit de nom (disponibilité définitive vérifiée au dépôt).`
                      : undefined
                  }
                >
                  <input
                    value={data.nom}
                    maxLength={MAX_LEN.nom}
                    placeholder="Ex. : Studio Alba"
                    onChange={(e) => updateData({ nom: e.target.value })}
                  />
                </Field>
                <Field label="Nom commercial" hint="S’il diffère du nom de la société.">
                  <input
                    value={data.nomCommercial}
                    maxLength={MAX_LEN.nom}
                    onChange={(e) => updateData({ nomCommercial: e.target.value })}
                  />
                </Field>
                <Field label="Que fera votre société ?" hint="Une phrase suffit, nous la mettrons en forme.">
                  <textarea
                    value={data.activite}
                    placeholder="Ex. : conception de sites web pour les petites entreprises"
                    onChange={(e) => updateData({ activite: e.target.value })}
                  />
                </Field>
                <Field label="Capital social (€)" hint="Le capital est déposé avant l’immatriculation.">
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={data.capital}
                    onChange={(e) => updateData({ capital: e.target.value })}
                  />
                </Field>
                {forme === "SASU" && (
                  <Field
                    label="Valeur nominale d’une action (€)"
                    hint="Si vous ne savez pas, laissez 1 € — ça convient à n’importe quel capital. Doit diviser le capital exactement."
                  >
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={data.valeurNominale}
                      onChange={(e) => updateData({ valeurNominale: e.target.value })}
                    />
                  </Field>
                )}
                <div className="f">
                  <label>Où sera le siège ?</label>
                </div>
                <div className="opts">
                  {(
                    [
                      ["dirigeant", "Chez le dirigeant", "Votre domicile, si le bail ou la copropriété l’autorise."],
                      ["local", "Dans un local", "Bureau, boutique ou local commercial."],
                      ["domiciliation", "Chez un domiciliataire", "Nous vous proposons une adresse à l’étape finale."],
                    ] as const
                  ).map(([v, b, em]) => (
                    <label className="opt" key={v}>
                      <input
                        type="radio"
                        name="siege"
                        checked={data.siege === v}
                        onChange={() => updateData({ siege: v })}
                      />
                      <span>
                        <b>{b}</b>
                        <em>{em}</em>
                      </span>
                    </label>
                  ))}
                </div>
                {data.siege !== "domiciliation" && (
                  <>
                    <Field label="Adresse du siège">
                      <input
                        value={data.adresse}
                        maxLength={MAX_LEN.adresse}
                        placeholder="12 rue des Lilas"
                        onChange={(e) => updateData({ adresse: e.target.value })}
                      />
                    </Field>
                    <div className="g2">
                      <Field label="Code postal">
                        <input
                          value={data.codePostal}
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="75011"
                          onChange={(e) => updateData({ codePostal: sanitizeCodePostal(e.target.value) })}
                        />
                      </Field>
                      <Field label="Ville">
                        <input
                          value={data.ville}
                          maxLength={MAX_LEN.nom}
                          placeholder="Paris"
                          onChange={(e) => updateData({ ville: e.target.value })}
                        />
                      </Field>
                    </div>
                  </>
                )}
                <Field label="Clôture du premier exercice">
                  <select value={data.cloture} onChange={(e) => updateData({ cloture: e.target.value })}>
                    {["31 décembre", "30 juin", "31 mars", "30 septembre"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {stepKey === "Associés" && (
              <>
                <h2>{f.uni ? "Qui est l’associé unique ?" : "Qui sont les associés ?"}</h2>
                <p className="sub">
                  {f.uni ? `Une ${forme} n’a qu’un seul associé.` : `Une ${forme} compte au moins deux associés.`}
                </p>
                {associes.map((a, i) => (
                  <div className="cardx" key={i}>
                    <h3>
                      Associé {i + 1}
                      {associes.length > (f.uni ? 1 : 2) && (
                        <button type="button" onClick={() => removeAssocie(i)}>
                          Retirer
                        </button>
                      )}
                    </h3>
                    <Field label="Civilité">
                      <select
                        value={a.civilite}
                        onChange={(e) => updateAssocie(i, { civilite: e.target.value as "M" | "Mme" })}
                      >
                        <option value="M">M.</option>
                        <option value="Mme">Mme</option>
                      </select>
                    </Field>
                    <div className="g2">
                      <Field label="Prénom">
                        <input
                          value={a.prenom}
                          maxLength={MAX_LEN.nom}
                          onChange={(e) => updateAssocie(i, { prenom: e.target.value })}
                        />
                      </Field>
                      <Field label="Nom">
                        <input
                          value={a.nom}
                          maxLength={MAX_LEN.nom}
                          onChange={(e) => updateAssocie(i, { nom: e.target.value })}
                        />
                      </Field>
                      <Field label="Date de naissance">
                        <input
                          type="date"
                          value={a.dateNaissance}
                          onChange={(e) => updateAssocie(i, { dateNaissance: e.target.value })}
                        />
                      </Field>
                      <Field label="Lieu de naissance">
                        <input
                          value={a.lieuNaissance}
                          maxLength={MAX_LEN.nom}
                          placeholder="Ville (et pays si hors de France)"
                          onChange={(e) => updateAssocie(i, { lieuNaissance: e.target.value })}
                        />
                      </Field>
                      <Field label="Nationalité">
                        <input
                          value={a.nationalite}
                          maxLength={MAX_LEN.nationalite}
                          onChange={(e) => updateAssocie(i, { nationalite: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="Adresse personnelle">
                      <input
                        value={a.adresse}
                        maxLength={MAX_LEN.adresse}
                        placeholder="Rue"
                        onChange={(e) => updateAssocie(i, { adresse: e.target.value })}
                      />
                    </Field>
                    <div className="g2">
                      <Field label="Code postal">
                        <input
                          value={a.codePostal}
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="75011"
                          onChange={(e) => updateAssocie(i, { codePostal: sanitizeCodePostal(e.target.value) })}
                        />
                      </Field>
                      <Field label="Ville">
                        <input
                          value={a.ville}
                          maxLength={MAX_LEN.nom}
                          placeholder="Paris"
                          onChange={(e) => updateAssocie(i, { ville: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="Apport en numéraire (€)">
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={a.apportEur}
                        onChange={(e) => updateAssocie(i, { apportEur: e.target.value })}
                      />
                    </Field>
                    <p className="msg" style={{ margin: "-10px 0 14px", color: "var(--ink2)", fontSize: 14 }}>
                      {capital && a.apportEur ? `${Math.round((Number(a.apportEur) / capital) * 1000) / 10} % du capital` : ""}
                    </p>
                  </div>
                ))}
                {!f.uni && (
                  <button type="button" className="btn alt" onClick={addAssocie}>
                    Ajouter un associé
                  </button>
                )}
                <div className="sumline" style={{ marginTop: 16, color: apports !== capital ? "var(--red)" : undefined }}>
                  <span>Total des apports</span>
                  <span>
                    {eur(apports)} sur {eur(capital)}
                  </span>
                </div>
              </>
            )}

            {stepKey === "Dirigeant" && (
              <>
                <h2>Qui sera {f.dir.toLowerCase()} ?</h2>
                <p className="sub">La personne qui représente la société et signe en son nom.</p>
                <Field label="Dirigeant">
                  <select value={data.dirigeantIdx} onChange={(e) => updateData({ dirigeantIdx: e.target.value })}>
                    {associes.map((a, i) => (
                      <option value={String(i)} key={i}>
                        {(a.prenom + " " + a.nom).trim() || `Associé ${i + 1}`}
                      </option>
                    ))}
                    <option value="x">Une autre personne</option>
                  </select>
                </Field>
                {data.dirigeantIdx === "x" && (
                  <Field label="Nom complet du dirigeant">
                    <input
                      value={data.dirigeantNom}
                      maxLength={MAX_LEN.nom}
                      onChange={(e) => updateData({ dirigeantNom: e.target.value })}
                    />
                  </Field>
                )}
                <Field label="Durée du mandat">
                  <select value={data.mandat} onChange={(e) => updateData({ mandat: e.target.value })}>
                    {["Durée illimitée", "3 ans", "6 ans"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Checkbox checked={data.nonCondamnation} onChange={(v) => updateData({ nonCondamnation: v })}>
                  Je déclare sur l’honneur n’avoir fait l’objet d’aucune condamnation m’interdisant de diriger une
                  société. Vous signerez vos statuts en ligne à l’étape suivante.
                </Checkbox>
                <p className="sub">Les bénéficiaires effectifs sont déclarés automatiquement à partir de vos associés.</p>
              </>
            )}

            {stepKey === "Votre société" && (
              <>
                <h2>Quelle société est concernée ?</h2>
                <p className="sub">Retrouvez ces informations sur votre extrait Kbis.</p>
                <div className="g2">
                  <Field
                    label="SIREN"
                    hint={
                      sirenCheck.status === "checking"
                        ? "Vérification…"
                        : sirenCheck.status === "ok"
                          ? `✓ ${sirenCheck.nom}`
                          : sirenCheck.status === "not_found"
                            ? "Aucune société active trouvée avec ce SIREN."
                            : sirenCheck.status === "error"
                              ? "Vérification indisponible pour l’instant."
                              : undefined
                    }
                  >
                    <input
                      value={data.siren}
                      placeholder="9 chiffres"
                      inputMode="numeric"
                      maxLength={9}
                      onChange={(e) => updateData({ siren: e.target.value.replace(/\D/g, "") })}
                    />
                  </Field>
                  <Field label="Nom de la société">
                    <input
                      value={data.nom}
                      maxLength={MAX_LEN.nom}
                      onChange={(e) => updateData({ nom: e.target.value })}
                    />
                  </Field>
                </div>
                {type === "modification" ? (
                  <>
                    <Field label="Que souhaitez-vous changer ?">
                      <select value={data.nature} onChange={(e) => updateData({ nature: e.target.value })}>
                        {[
                          "Transfert de siège",
                          "Changement de dirigeant",
                          "Modification des statuts",
                          "Cession de parts",
                          "Changement d’activité",
                          "Autre",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Détails">
                      <textarea
                        value={data.details}
                        placeholder="Ex. : le siège passe au 8 avenue Victor Hugo, 69003 Lyon"
                        onChange={(e) => updateData({ details: e.target.value })}
                      />
                    </Field>
                    <Field label="Date souhaitée" hint="Laissez vide si vous n’avez pas de date précise.">
                      <input type="date" value={data.dateEffet} onChange={(e) => updateData({ dateEffet: e.target.value })} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Motif de la fermeture">
                      <select value={data.motif} onChange={(e) => updateData({ motif: e.target.value })}>
                        {["Cessation d’activité", "Décision des associés", "Fin de la durée statutaire", "Autre"].map(
                          (v) => (
                            <option key={v}>{v}</option>
                          )
                        )}
                      </select>
                    </Field>
                    <Field label="Date d’effet souhaitée">
                      <input type="date" value={data.dateEffet} onChange={(e) => updateData({ dateEffet: e.target.value })} />
                    </Field>
                  </>
                )}
              </>
            )}

            {stepKey === "Pièces" && (
              <>
                <h2>Vos pièces</h2>
                <p className="sub">
                  Préparez ces documents (photo ou scan, lisible, en PDF, JPG ou PNG) : nous vous demanderons de
                  les déposer une fois votre dossier reçu.
                </p>
                <ul className="ck">
                  {NEED_BEFORE[type].map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            )}

            {stepKey === "Formule" && (
              <>
                <h2>Choisissez votre formule</h2>
                <p className="sub">Plus vous nous confiez, plus nous faisons à votre place.</p>
                <div className="opts" role="radiogroup" aria-label="Formule">
                  {PLANS.map((p, i) => (
                    <label className="opt" key={p.n}>
                      <input
                        type="radio"
                        name="plan"
                        checked={data.plan === String(i)}
                        onChange={() => updateData({ plan: String(i) })}
                      />
                      <span>
                        <b>{p.n}</b>
                        <em>{p.f.filter((x) => !x.endsWith(":")).slice(0, 2).join(" · ")}</em>
                        <span className="pp">{PRIX[type][i] === 0 ? "0 €" : eur(PRIX[type][i])}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="f">
                  <label>Options</label>
                </div>
                <div className="opts">
                  {OPTS.map((o) => (
                    <label className="opt" key={o.k}>
                      <input
                        type="checkbox"
                        checked={data.opts[o.k]}
                        onChange={(e) => updateData({ opts: { ...data.opts, [o.k]: e.target.checked } })}
                      />
                      <span>
                        <b>{o.n}</b>
                        <em>{o.p}</em>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="g2">
                  <Field label="Votre nom complet">
                    <input
                      value={data.contact}
                      maxLength={MAX_LEN.nom}
                      onChange={(e) => updateData({ contact: e.target.value })}
                    />
                  </Field>
                  <Field label="Téléphone">
                    <input
                      type="tel"
                      inputMode="tel"
                      value={data.telephone}
                      maxLength={MAX_LEN.telephone}
                      placeholder="06 12 34 56 78"
                      onChange={(e) => updateData({ telephone: sanitizeTelephone(e.target.value) })}
                    />
                  </Field>
                </div>
                <Field label="E-mail" hint="Nous y envoyons la confirmation et chaque mise à jour.">
                  <input
                    type="email"
                    value={data.email}
                    maxLength={MAX_LEN.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                  />
                </Field>
                <div className="recap">
                  {recapLines(type, data).map((l) => (
                    <div key={l.label} className="sumline" style={{ marginBottom: 8 }}>
                      <span>{l.label}</span>
                      <span>{l.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 16 }} />
                <Checkbox checked={data.consent} onChange={(v) => updateData({ consent: v })}>
                  J’accepte que Fondée traite mon dossier et me contacte à ce sujet.
                </Checkbox>
              </>
            )}

            {error && (
              <p className="stepErr" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="actions">
            {step > 0 ? (
              <button type="button" className="btn alt" onClick={goBack}>
                Retour
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="btn big" onClick={goNext} disabled={status === "submitting"}>
              {step === steps.length - 1
                ? status === "submitting"
                  ? "Envoi…"
                  : "Envoyer mon dossier"
                : "Continuer"}{" "}
              <ArrowIcon />
            </button>
          </div>
        </div>

        {(type !== "creation" || stepKey !== "Pièces") && (
          <StatutsPreview type={type} forme={forme} data={data} associes={associes} />
        )}
      </div>
    </div>
  );
}
