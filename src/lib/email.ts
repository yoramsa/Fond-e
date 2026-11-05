import "server-only";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

/**
 * Envoi d'e-mails transactionnels (hors auth, gérée par Supabase). Ne
 * bloque jamais l'action en cours : une erreur d'envoi est journalisée
 * côté serveur et avalée, le dossier reste valide même si l'e-mail
 * échoue (ex. clé API absente, domaine Resend non vérifié).
 */
async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY absente : e-mail non envoyé.", input.subject);
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Legalgo <${FROM}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
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
      <p>— L'équipe Legalgo</p>
    `,
  });
}

/**
 * Statuts SASU pré-remplis envoyés au cabinet dès la soumission — à
 * relire avant tout usage officiel, les champs non collectés par le
 * questionnaire (ex. président distinct de l'associé) restent à
 * compléter à la main.
 */
export async function sendStatutsToCabinet(input: {
  ref: string;
  societeNom: string;
  buffer: Buffer;
  contactNom?: string;
  contactEmail?: string;
  contactTelephone?: string;
}) {
  const to = process.env.CABINET_NOTIFICATION_EMAIL;
  if (!to) {
    console.warn("CABINET_NOTIFICATION_EMAIL absente : statuts non envoyés.", input.ref);
    return;
  }
  const contactLines = [
    input.contactNom && `Nom : ${input.contactNom}`,
    input.contactEmail && `E-mail : ${input.contactEmail}`,
    input.contactTelephone && `Téléphone : ${input.contactTelephone}`,
  ].filter(Boolean);
  await sendEmail({
    to,
    subject: `Statuts à relire — ${input.societeNom || input.ref} (${input.ref})`,
    html: `
      <p>Nouveau dossier de création SASU : <strong>${input.societeNom || input.ref}</strong> (${input.ref}).</p>
      <p>Statuts pré-remplis à partir des réponses du client, en pièce jointe — à relire avant tout usage officiel.</p>
      ${
        contactLines.length > 0
          ? `<p>Coordonnées du client (tant que la confirmation automatique n'est pas active) :<br>${contactLines.join("<br>")}</p>`
          : ""
      }
    `,
    attachments: [{ filename: `Statuts-${input.ref}.docx`, content: input.buffer }],
  });
}
