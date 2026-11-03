"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordPieceUpload } from "@/app/mon-dossier/actions";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export type PieceRow = {
  id: string;
  dossier_id: string;
  kind: string;
  label: string;
  status: "manquante" | "recue" | "a_remplacer";
  original_filename: string | null;
};

export default function PieceUploader({ piece }: { piece: PieceRow }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState(piece.original_filename);
  const [received, setReceived] = useState(piece.status === "recue");

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Format non accepté : PDF, JPG ou PNG uniquement.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Fichier trop volumineux (10 Mo maximum).");
      return;
    }

    setStatus("uploading");
    const supabase = createClient();
    const path = `${piece.dossier_id}/${piece.id}/${file.name}`;

    const { error: uploadError } = await supabase.storage.from("pieces").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (uploadError) {
      setStatus("error");
      setError("Échec de l’envoi. Réessayez.");
      return;
    }

    const result = await recordPieceUpload({
      pieceId: piece.id,
      storagePath: path,
      originalFilename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    });
    if (!result.ok) {
      setStatus("error");
      setError(result.message);
      return;
    }

    setStatus("idle");
    setFilename(file.name);
    setReceived(true);
  }

  return (
    <label className={`drop${received ? " has" : ""}`}>
      <input
        type="file"
        accept={ACCEPTED.join(",")}
        disabled={status === "uploading"}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <span style={{ display: "block" }}>
        <b>{piece.label}</b>
        <em>
          {status === "uploading"
            ? "Envoi…"
            : received
              ? `Reçue — ${filename}`
              : error ?? "PDF, JPG ou PNG, 10 Mo maximum"}
        </em>
      </span>
    </label>
  );
}
