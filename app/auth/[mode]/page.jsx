import AuthClient from "../AuthClient";

export default async function AuthModePage({ params }) {
  const { mode } = await params;

  return (
    <AuthClient
      mode={mode === "register" ? "register" : "login"}
    />
  );
}