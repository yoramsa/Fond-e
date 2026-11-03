export default function SignOutButton() {
  return (
    <form action="/auth/deconnexion" method="post">
      <button type="submit" className="btn alt sm">
        Se déconnecter
      </button>
    </form>
  );
}
