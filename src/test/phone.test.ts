import { describe, it, expect } from "vitest"
import {
  normalizeWhatsAppPhone,
  splitWhatsAppPhone,
  buildWhatsAppUrl,
  buildWhatsAppApiUrl,
} from "@/lib/phone"

describe("normalizeWhatsAppPhone", () => {
  it("retorna null para null", () => {
    expect(normalizeWhatsAppPhone(null)).toBeNull()
  })

  it("retorna null para undefined", () => {
    expect(normalizeWhatsAppPhone(undefined)).toBeNull()
  })

  it("retorna null para string vazia", () => {
    expect(normalizeWhatsAppPhone("")).toBeNull()
  })

  it("número brasileiro completo com DDI: '5511987654321' → '5511987654321'", () => {
    expect(normalizeWhatsAppPhone("5511987654321")).toBe("5511987654321")
  })

  it("número brasileiro sem DDI (11 dígitos): '11987654321' → '5511987654321'", () => {
    expect(normalizeWhatsAppPhone("11987654321")).toBe("5511987654321")
  })

  it("número brasileiro sem DDI (10 dígitos): '1187654321' → '551187654321'", () => {
    expect(normalizeWhatsAppPhone("1187654321")).toBe("551187654321")
  })

  it("com máscara '(11) 98765-4321' → '5511987654321'", () => {
    expect(normalizeWhatsAppPhone("(11) 98765-4321")).toBe("5511987654321")
  })

  it("com prefixo '00': '005511987654321' → '5511987654321'", () => {
    expect(normalizeWhatsAppPhone("005511987654321")).toBe("5511987654321")
  })

  it("com zero de tronco: '011987654321' → '5511987654321'", () => {
    expect(normalizeWhatsAppPhone("011987654321")).toBe("5511987654321")
  })

  it("retorna null para número inválido muito curto (5 dígitos)", () => {
    expect(normalizeWhatsAppPhone("12345")).toBeNull()
  })

  it("retorna null para número inválido muito longo (16 dígitos após normalização)", () => {
    // 16 dígitos puros → excede o limite E.164 de 15
    expect(normalizeWhatsAppPhone("1234567890123456")).toBeNull()
  })
})

describe("splitWhatsAppPhone", () => {
  it("número BR normalizado '5511987654321' → { countryCode: '55', nationalNumber: '11987654321' }", () => {
    const result = splitWhatsAppPhone("5511987654321")
    expect(result).toEqual({ countryCode: "55", nationalNumber: "11987654321" })
  })

  it("null → { countryCode: '55', nationalNumber: '' }", () => {
    const result = splitWhatsAppPhone(null)
    expect(result).toEqual({ countryCode: "55", nationalNumber: "" })
  })
})

describe("buildWhatsAppUrl", () => {
  it("contém 'wa.me/5511999999999' e 'text=' no resultado", () => {
    const url = buildWhatsAppUrl("5511999999999", "Olá!")
    expect(url).toContain("wa.me/5511999999999")
    expect(url).toContain("text=")
  })
})

describe("buildWhatsAppApiUrl", () => {
  it("contém 'api.whatsapp.com/send' e 'phone=5511999999999' no resultado", () => {
    const url = buildWhatsAppApiUrl("5511999999999", "Olá!")
    expect(url).toContain("api.whatsapp.com/send")
    expect(url).toContain("phone=5511999999999")
  })
})
