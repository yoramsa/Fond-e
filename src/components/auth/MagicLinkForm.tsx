"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="sumline" role="status">
        <span>Un lien de connexion vient d’être envoyé à {email}.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
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
          {status === "error" && "Impossible d’envoyer le lien. Vérifiez l’adresse et réessayez."}
        </span>
      </div>
      <button type="submit" className="btn" disabled={status === "sending"}>
        {status === "sending" ? "Envoi…" : "Recevoir le lien de connexion"}
      </button>
    </form>
  );
}
