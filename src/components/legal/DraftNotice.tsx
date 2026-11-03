export default function DraftNotice() {
  return (
    <div
      role="note"
      style={{
        background: "var(--hi)",
        border: "2px solid var(--ink)",
        borderRadius: 14,
        padding: "16px 20px",
        margin: "0 0 32px",
        fontWeight: 600,
        fontSize: 15,
      }}
    >
      Brouillon technique — ce texte doit être relu et validé par un juriste avant toute
      publication réelle. Les informations entre crochets sont à compléter.
    </div>
  );
}
