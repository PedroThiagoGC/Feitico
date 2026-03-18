export interface PhoneParts {
  countryCode: string;
  nationalNumber: string;
}

/**
 * Normaliza para dígitos E.164 sem o sinal '+', pronto para o parâmetro phone do WhatsApp.
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined, defaultCountryCode = "55"): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Remove prefixo internacional "00" quando informado.
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Remove zero de tronco local (ex.: 011...) quando aplicável.
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  // Se vier só com DDD + número (BR), injeta DDI padrão.
  if (digits.length === 10 || digits.length === 11) {
    digits = `${defaultCountryCode}${digits}`;
  }

  // Limite típico E.164: entre 8 e 15 dígitos no total.
  if (digits.length < 8 || digits.length > 15) return null;

  return digits;
}

export function splitWhatsAppPhone(raw: string | null | undefined, defaultCountryCode = "55"): PhoneParts {
  const normalized = normalizeWhatsAppPhone(raw, defaultCountryCode);

  if (!normalized) {
    return {
      countryCode: defaultCountryCode,
      nationalNumber: "",
    };
  }

  // Estratégia simples para UX local: se começar com DDI padrão, separa nele.
  if (normalized.startsWith(defaultCountryCode) && normalized.length > defaultCountryCode.length) {
    return {
      countryCode: defaultCountryCode,
      nationalNumber: normalized.slice(defaultCountryCode.length),
    };
  }

  // Fallback internacional: assume 2 a 3 dígitos de DDI.
  const ccLength = normalized.length >= 13 ? 3 : 2;
  return {
    countryCode: normalized.slice(0, ccLength),
    nationalNumber: normalized.slice(ccLength),
  };
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodedMessage}&type=phone_number&app_absent=0`;
}
