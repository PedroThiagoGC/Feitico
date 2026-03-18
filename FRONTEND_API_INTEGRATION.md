# Guia de Integração API Client - Frontend

Este documento descreve como integrar o novo `ApiClient` nos componentes React existentes, refatorando chamadas diretas ao Supabase para usar o backend.

## Visão Geral da Migração

### Antes (Supabase Direto)

```typescript
// ❌ Chamadas diretas ao Supabase
const { data: bookings } = await supabase
  .from("bookings")
  .select("*")
  .eq("user_id", userId);
```

### Depois (Via Backend API)

```typescript
// ✅ Através do Backend
import { api } from "@/services/api";

const bookings = await api.getBookings();
```

## Benefícios

- ✅ Lógica de negócio centralizada no backend
- ✅ Segurança: SERVICE_ROLE_KEY apenas no backend
- ✅ Escalabilidade: Cache, rate limiting, logging no backend
- ✅ Manutenibilidade: Uma fonte de verdade
- ✅ Auditoria: Todos os acessos rastreáveis no backend

## Integração em Hooks Customizados

### Exemplo: `useBooking.ts`

**Antes:**

```typescript
// ❌ Supabase direto
export const useBooking = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      setBookings(data);
    };

    loadBookings();
  }, []);

  return { bookings };
};
```

**Depois:**

```typescript
// ✅ Use API Client
import { api } from "@/services/api";

export const useBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await api.getBookings();
        setBookings(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar reservas",
        );
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    createBooking: async (booking) => {
      const newBooking = await api.createBooking(booking);
      setBookings([...bookings, newBooking]);
      return newBooking;
    },
    updateBooking: async (id, updates) => {
      const updated = await api.updateBooking(id, updates);
      setBookings(bookings.map((b) => (b.id === id ? updated : b)));
      return updated;
    },
    deleteBooking: async (id) => {
      await api.deleteBooking(id);
      setBookings(bookings.filter((b) => b.id !== id));
    },
  };
};
```

## Integração em Componentes Admin

### AdminBookings.tsx

**Antes:**

```typescript
export const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const { data } = await supabase.from("bookings").select("*");
    setBookings(data);
  }, []);

  const handleCreate = async (booking) => {
    await supabase.from("bookings").insert([booking]);
    // Refetch manualmente
  };
};
```

**Depois:**

```typescript
import { api } from '@/services/api';
import { useBooking } from '@/hooks/useBooking';

export const AdminBookings = () => {
  const { bookings, loading, createBooking, updateBooking, deleteBooking } = useBooking();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (formData: CreateBookingInput) => {
    try {
      setError(null);
      await createBooking(formData);
      // Hook já atualiza estado automaticamente
      toast.success('Reserva criada!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar reserva';
      setError(message);
      toast.error(message);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      setError(null);
      await updateBooking(id, updates);
      toast.success('Reserva atualizada!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar';
      setError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma exclusão?')) return;

    try {
      setError(null);
      await deleteBooking(id);
      toast.success('Reserva deletada!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar';
      setError(message);
      toast.error(message);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservas</h2>
        <button onClick={() => {/* open dialog */}}>+ Nova Reserva</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th>Data</th>
              <th>Cliente</th>
              <th>Profissional</th>
              <th>Serviço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id} className="border-b hover:bg-gray-50">
                <td>{new Date(booking.scheduled_at).toLocaleDateString()}</td>
                <td>{booking.client_name}</td>
                <td>{booking.professional?.name || '-'}</td>
                <td>{booking.service?.name || '-'}</td>
                <td>
                  <select
                    value={booking.status}
                    onChange={(e) => handleUpdate(booking.id, { status: e.target.value })}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="completed">Completada</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => handleDelete(booking.id)} className="text-red-500">
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## Integração em Componentes Landing

### Booking.tsx (Agendar Serviço)

**Antes:**

```typescript
export const Booking = () => {
  const handleSubmit = async (data) => {
    await supabase.from("bookings").insert([
      {
        client_name: data.name,
        client_email: data.email,
        scheduled_at: data.date,
        // ...
      },
    ]);
  };
};
```

**Depois:**

```typescript
import { api } from '@/services/api';

export const Booking = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      await api.createBooking({
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone,
        scheduled_at: data.date,
        service_id: data.serviceId,
        professional_id: data.professionalId,
        notes: data.notes,
      });

      toast.success('Reserva realizada com sucesso!');
      // Redirecionar ou fechar dialog
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao agendar';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* form fields */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-600 text-white py-2 rounded"
      >
        {isSubmitting ? 'Agendando...' : 'Agendar Serviço'}
      </button>
    </form>
  );
};
```

## Padrão: Hooks para Cada Recurso

Todos os hooks em `src/hooks/` seguem o mesmo padrão:

```typescript
// hooks/useProfe

ssionals.ts
import { api } from '@/services/api';

export const useProfessionals = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getProfessionals();
        setProfessionals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    professionals,
    loading,
    error,
    refetch: async () => {
      const data = await api.getProfessionals();
      setProfessionals(data);
    },
    create: async (prof) => {
      const created = await api.createProfessional(prof);
      setProfessionals([...professionals, created]);
      return created;
    },
    update: async (id, updates) => {
      const updated = await api.updateProfessional(id, updates);
      setProfessionals(professionals.map(p => p.id === id ? updated : p));
      return updated;
    },
    delete: async (id) => {
      await api.deleteProfessional(id);
      setProfessionals(professionals.filter(p => p.id !== id));
    },
  };
};

// Uso em componente
export const ProfessionalsPage = () => {
  const { professionals, loading, error, create, update, delete: deleteProfessional } = useProfessionals();

  return (
    <div>
      {professionals.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <button onClick={() => deleteProfessional(p.id)}>Deletar</button>
        </div>
      ))}
    </div>
  );
};
```

## Autenticação com API

### Login via Backend

**Antes:**

```typescript
// ❌ Supabase auth diretamente
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**Depois:**

```typescript
// ✅ Via Backend API
import { api } from "@/services/api";

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await api.login(email, password);

    // API retorna: { token: jwt, user: {...} }
    localStorage.setItem("authToken", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    // Redirecionar para dashboard
    navigate("/admin");
  } catch (error) {
    toast.error("Email ou senha inválidos");
  }
};
```

### Verificar Autenticação

```typescript
// auth-context.tsx
import { api } from '@/services/api';
import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se tem token guardado
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        // Verificar se token ainda é válido
        api.verifyToken().then(() => {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }).catch(() => {
          // Token inválido
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        });
      } catch {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar autenticação
export const useAuth = () => useContext(AuthContext);
```

## Error Handling Centralizado

```typescript
// services/api.ts - melhorar tratamento de erros
private async request<T>(
  method: string,
  endpoint: string,
  body?: any,
): Promise<T> {
  // ... código existente ...

  const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (response.status === 403) {
      throw new Error('Você não tem permissão para esta ação');
    }

    if (response.status === 404) {
      throw new Error('Recurso não encontrado');
    }

    if (response.status === 409) {
      const error = await response.json();
      throw new Error(error.message || 'Conflito nos dados');
    }

    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

## Testing Integração API

```typescript
// test/api-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { api } from "@/services/api";

describe("API Client Integration", () => {
  beforeAll(() => {
    // Setup: login
    localStorage.setItem("authToken", "test_token_here");
  });

  afterAll(() => {
    localStorage.removeItem("authToken");
  });

  it("should health check", async () => {
    const health = await api.health();
    expect(health.status).toBe("ok");
  });

  it("should fetch professionals", async () => {
    const professionals = await api.getProfessionals();
    expect(Array.isArray(professionals)).toBe(true);
  });

  it("should create booking", async () => {
    const booking = await api.createBooking({
      client_name: "Test Client",
      client_email: "test@example.com",
      scheduled_at: new Date().toISOString(),
      service_id: "service_1",
      professional_id: "prof_1",
    });
    expect(booking.id).toBeDefined();
  });
});
```

## Checklist de Migração

Por arquivo de componente:

- [ ] AdminBookings.tsx → Use `useBooking()` hook
- [ ] AdminProfessionals.tsx → Use `useProfessionals()` hook
- [ ] AdminServices.tsx → Use `useServices()` hook
- [ ] AdminGallery.tsx → Use `useGallery()` hook
- [ ] AdminTestimonials.tsx → Use `useTestimonials()` hook
- [ ] Booking.tsx → Use `api.createBooking()`
- [ ] Header.tsx (Login) → Use `api.login()`
- [ ] Services.tsx → Use `api.getServices()`
- [ ] Testimonials.tsx → Use `api.getTestimonials()`
- [ ] Gallery.tsx → Use `api.getGallery()`

## Próximos Passos

1. ✅ Criar hooks para cada recurso
2. ✅ Refatorar componentes Admin um por um
3. ✅ Testar localmente: Frontend → Backend → Supabase
4. ✅ Testes automatizados
5. ✅ Deploy para staging (preview Vercel)
6. ✅ QA Testing
7. ✅ Deploy produção

## Suporte

Se algum componente não conseguir migrar:

- Verificar se o método existe em `api.ts`
- Verificar se o backend implementou o endpoint correspondente
- Verificar logs do backend em Supabase

Exemplo: Se `AdminGallery.tsx` precisa filtrar por categoria:

```typescript
// Adicionar em apps/api/src/modules/gallery/services.ts
async findByCategory(category: string) {
  // Implementar query
}

// Adicionar em apps/web/src/services/api.ts
async getGalleryByCategory(category: string) {
  return this.request<Gallery[]>('GET', `/gallery?category=${category}`);
}

// Usar em componente
const images = await api.getGalleryByCategory('haircuts');
```
