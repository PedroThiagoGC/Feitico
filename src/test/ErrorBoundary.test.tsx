import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ErrorBoundary } from "@/components/ErrorBoundary"

// Componente auxiliar que lança erro condicionalmente
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("Erro de teste")
  return <div>Conteúdo ok</div>
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renderiza children quando não há erro", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Conteúdo ok")).toBeInTheDocument()
  })

  it("renderiza fallback padrão com mensagem de erro quando filho lança", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Algo deu errado.")).toBeInTheDocument()
    expect(screen.getByText("Erro de teste")).toBeInTheDocument()
  })

  it("renderiza fallback customizado quando fornecido", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom fallback")).toBeInTheDocument()
  })
})
