import "server-only";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

/**
 * Envoi d'e-mails transactionnels (hors auth, gérée par Supabase). Ne
 * bloque jamais l'action en cours : une erreur d'envoi est journalisée
 * côté serveur et avalée, le dossier reste valide même si l'e-mail
 * échoue (ex. clé API absente, domaine Resend non vérifié).
 */
async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY absente : e-mail non envoyé.", input.subject);
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Fondée <${FROM}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) {
      console.error("Échec de l'envoi d'e-mail :", error);
    }
  } catch (err) {
    console.error("Échec de l'envoi d'e-mail :", err);
  }
}

export async function sendDossierReceivedEmail(input: { to: string; ref: string; societeNom: string }) {
  await sendEmail({
    to: input.to,
    subject: `Dossier ${input.ref} reçu`,
    html: `
      <p>Bonjour,</p>
      <p>Votre dossier <strong>${input.societeNom || input.ref}</strong> (référence <strong>${input.ref}</strong>) a bien été reçu.</p>
      <p>Un expert-comptable va le relire. Vous pouvez suivre son avancement et déposer vos pièces depuis votre espace, à tout moment.</p>
      <p>— L'équipe Fondée</p>
    `,
  });
}
