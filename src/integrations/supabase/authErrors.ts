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
    return "Email ou senha incorretos. Verifique seus dados e tente novamente.";
  }

  if (
    normalizedCode === "email_not_confirmed" ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  }

  if (
    normalizedCode === "too_many_requests" ||
    normalizedMessage.includes("too many requests") ||
    normalizedMessage.includes("rate limit")
  ) {
    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }

  if (
    normalizedCode === "user_not_found" ||
    normalizedMessage.includes("user not found")
  ) {
    return "Email ou senha incorretos. Verifique seus dados e tente novamente.";
  }

  return "Não foi possível realizar o login no momento. Tente novamente.";
}
