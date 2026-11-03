"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "enroll" | "challenge" | "error";

export default function MfaGate() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setError(error.message);
        setMode("error");
        return;
      }
      const verifiedTotp = data.totp.find((f) => f.status === "verified");
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setMode("challenge");
      } else {
        const enroll = await supabase.auth.mfa.enroll({ factorType: "totp" });
        if (enroll.error) {
          setError(enroll.error.message);
          setMode("error");
          return;
        }
        setFactorId(enroll.data.id);
        setQrCode(enroll.data.totp.qr_code);
        setSecret(enroll.data.totp.secret);
        setMode("enroll");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(challengeError.message);
      setBusy(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (verifyError) {
      setError("Code invalide. Réessayez.");
      return;
    }
    router.replace("/cabinet");
    router.refresh();
  }

  if (mode === "loading") return <p className="sub">Vérification de votre compte…</p>;
  if (mode === "error") {
    return (
      <div className="sumline bad" role="alert">
        <span>{error ?? "Une erreur est survenue."}</span>
      </div>
    );
  }

  return (
    <form onSubmit={verifyCode}>
      {mode === "enroll" && (
        <div style={{ marginBottom: 24 }}>
          <p className="sub" style={{ marginBottom: 16 }}>
            La double authentification est obligatoire pour l’espace cabinet. Scannez ce code avec
            votre application d’authentification (passkey, Google Authenticator, 1Password…).
          </p>
          {qrCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="Code QR d’activation de la double authentification" width={200} height={200} />
          )}
          {secret && (
            <p className="sub" style={{ marginTop: 8 }}>
              Ou saisissez cette clé manuellement : <code>{secret}</code>
            </p>
          )}
        </div>
      )}
      <div className="f">
        <label htmlFor="code">Code à 6 chiffres</label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <span className="msg" role="alert">
          {error}
        </span>
      </div>
      <button type="submit" className="btn" disabled={busy || code.length < 6}>
        {busy ? "Vérification…" : "Valider"}
      </button>
    </form>
  );
}
