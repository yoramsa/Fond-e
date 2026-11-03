"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RecordUploadInput = {
  pieceId: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
};

export type RecordUploadResult = { ok: true } | { ok: false; message: string };

/**
 * Marque une pièce comme reçue une fois le fichier déposé dans le bucket
 * de stockage, et journalise l'accès. L'écriture du journal passe par la
 * clé de service : `piece_access_log` n'accepte aucune écriture directe
 * du client (voir migration 0002_rls.sql).
 */
export async function recordPieceUpload(input: RecordUploadInput): Promise<RecordUploadResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const { data: piece, error } = await supabase
    .from("pieces")
    .update({
      storage_path: input.storagePath,
      original_filename: input.originalFilename,
      content_type: input.contentType,
      size_bytes: input.sizeBytes,
      status: "recue",
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", input.pieceId)
    .select("id")
    .single();

  if (error || !piece) {
    return { ok: false, message: error?.message ?? "Échec de l’enregistrement de la pièce." };
  }

  const admin = createAdminClient();
  await admin.from("piece_access_log").insert({
    piece_id: piece.id,
    accessed_by: user.id,
    action: "depot",
  });

  return { ok: true };
}
