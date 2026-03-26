type AppAuthError = Error & {
  code?: string;
};

export function formatAuthErrorMessage(error: AppAuthError): string {
  const normalizedMessage = error.message.toLowerCase();
  const normalizedCode = (error.code || "").toLowerCase();

  if (
    normalizedCode === "invalid_credentials" ||
    normalizedMessage.includes("invalid login credentials")
  ) {
    return "Email ou senha inválidos. Se o erro persistir, confirme se esse usuário existe neste mesmo projeto Supabase.";
  }

  return error.message || "Não foi possível autenticar no momento.";
}
