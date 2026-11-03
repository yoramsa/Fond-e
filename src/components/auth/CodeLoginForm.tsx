"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "code";

export default function CodeLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });
    setSending(false);
    if (otpError) {
      setError("Impossible d’envoyer le code. Vérifiez l’adresse e-mail.");
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setSending(false);
    if (verifyError) {
      setError("Code incorrect ou expiré. Vérifiez-le ou redemandez-en un.");
      return;
    }
    router.push("/mon-dossier");
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode}>
        <div className="sumline" role="status" style={{ marginBottom: 16 }}>
          <span>Un code vient d’être envoyé à {email}.</span>
        </div>
        <div className="f">
          <label htmlFor="code">Code reçu par e-mail</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
          <span className="msg" role="alert">
            {error}
          </span>
        </div>
        <button type="submit" className="btn" disabled={sending || !code.trim()}>
          {sending ? "Vérification…" : "Valider le code"}
        </button>
        <button
          type="button"
          className="btn alt"
          style={{ marginLeft: 12 }}
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
        >
          Changer d’e-mail
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode}>
      <div className="f">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
        />
        <span className="msg" role="alert">
          {error}
        </span>
      </div>
      <button type="submit" className="btn" disabled={sending}>
        {sending ? "Envoi…" : "Recevoir le code"}
      </button>
    </form>
  );
}
