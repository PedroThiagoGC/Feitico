# Guia de Implementação Backend com Supabase - NestJS

Este documento descreve como implementar os serviços NestJS para retornar **dados reais** do Supabase em vez de valores mock.

## Arquitetura Backend

```
┌─────────────────────────────────────────────────────┐
│           NestJS Controllers (API Routes)           │
│         /api/v1/bookings, /api/v1/professionals    │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│              NestJS Services (Business Logic)       │
│  BookingsService, ProfessionalsService, etc         │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│         SupabaseService (Data Access Layer)         │
│  SELECT, INSERT, UPDATE, DELETE via Supabase SDK   │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│            Supabase Cloud (PostgreSQL)              │
│  bookings, professionals, services, gallery, ...    │
└─────────────────────────────────────────────────────┘
```

## Setup Supabase Service

Já existe em `apps/api/src/integrations/supabase/supabase.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // ⚠️ Use SERVICE_ROLE no backend
    );
  }

  getClient() {
    return this.supabase;
  }

  // Helper methods
  async query(table: string, filter?: any) {
    let query = this.supabase.from(table).select('*');
    if (filter) Object.entries(filter).forEach(([k, v]) => query = query.eq(k, v));
    return query;
  }
}
```

## Implementar Serviços

### 1. BookingsService - Reservas

**Arquivo:** `apps/api/src/modules/bookings/services/bookings.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/integrations/supabase/supabase.service';
import { CreateBookingDto, UpdateBookingDto, BookingStatus } from '../dto';

@Injectable()
export class BookingsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Obter todas as reservas com filtros opcionais
   */
  async findAll(status?: BookingStatus, professionalId?: string) {
    let query = this.supabase
      .getClient()
      .from('bookings')
      .select(
        `
        *,
        client_id(id, name, email, phone),
        professional_id(id, name, image),
        service_id(id, name, duration, price)
      `,
      );

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (professionalId) {
      query = query.eq('professional_id', professionalId);
    }

    const { data, error } = await query.order('scheduled_at', {
      ascending: false,
    });

    if (error) {
      throw new BadRequestException(`Erro ao buscar reservas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obter uma reserva específica
   */
  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('bookings')
      .select(
        `
        *,
        client_id(id, name, email, phone),
        professional_id(id, name, image),
        service_id(id, name, duration, price)
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Reserva ${id} não encontrada`);
    }

    return data;
  }

  /**
   * Criar nova reserva
   */
  async create(dto: CreateBookingDto) {
    // Validar conflito de horário
    const existingBooking = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('professional_id', dto.professional_id)
      .eq('scheduled_at', new Date(dto.scheduled_at).toISOString())
      .eq('status', 'confirmed');

    if (existingBooking.data && existingBooking.data.length > 0) {
      throw new BadRequestException(
        'Profissional já tem reserva neste horário',
      );
    }

    // Obter duração do serviço
    const { data: service } = await this.supabase
      .getClient()
      .from('services')
      .select('duration')
      .eq('id', dto.service_id)
      .single();

    if (!service) {
      throw new BadRequestException('Serviço não encontrado');
    }

    // Calcular end_time
    const startTime = new Date(dto.scheduled_at);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    const { data, error } = await this.supabase
      .getClient()
      .from('bookings')
      .insert([
        {
          client_id: dto.client_id,
          professional_id: dto.professional_id,
          service_id: dto.service_id,
          scheduled_at: dto.scheduled_at,
          end_time: endTime.toISOString(),
          status: 'pending',
          notes: dto.notes || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao criar reserva: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualizar reserva
   */
  async update(id: string, dto: UpdateBookingDto) {
    const updates: any = {};

    if (dto.status) updates.status = dto.status;
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.scheduled_at) {
      updates.scheduled_at = dto.scheduled_at;
      // Recalcular end_time se mudou data
      if (dto.professional_id) {
        const { data: service } = await this.supabase
          .getClient()
          .from('services')
          .select('duration')
          .eq('id', dto.service_id || (await this.findOne(id)).service_id)
          .single();

        if (service) {
          const startTime = new Date(dto.scheduled_at);
          const endTime = new Date(startTime.getTime() + service.duration * 60000);
          updates.end_time = endTime.toISOString();
        }
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .getClient()
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao atualizar reserva: ${error.message}`);
    }

    return data;
  }

  /**
   * Deletar reserva
   */
  async delete(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Erro ao deletar reserva: ${error.message}`);
    }

    return { message: 'Reserva deletada com sucesso' };
  }

  /**
   * Obter estatísticas de reservas
   */
  async getStats() {
    const { data: allBookings, error: allError } = await this.supabase
      .getClient()
      .from('bookings')
      .select('status');

    if (allError) throw new BadRequestException(allError.message);

    const stats = {
      total: allBookings?.length || 0,
      pending: allBookings?.filter((b) => b.status === 'pending').length || 0,
      confirmed:
        allBookings?.filter((b) => b.status === 'confirmed').length || 0,
      cancelled:
        allBookings?.filter((b) => b.status === 'cancelled').length || 0,
      completed:
        allBookings?.filter((b) => b.status === 'completed').length || 0,
    };

    return stats;
  }
}
```

### 2. ProfessionalsService

**Arquivo:** `apps/api/src/modules/professionals/services/professionals.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/integrations/supabase/supabase.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from '../dto';

@Injectable()
export class ProfessionalsService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase
      .getClient()
      .from('professionals')
      .select(
        `
        *,
        specialties(id, name),
        opening_hours(day_of_week, start_time, end_time)
      `,
      )
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new BadRequestException(`Erro ao buscar profissionais: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('professionals')
      .select(
        `
        *,
        specialties(id, name),
        opening_hours(day_of_week, start_time, end_time)
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Profissional ${id} não encontrado`);
    }

    return data;
  }

  async create(dto: CreateProfessionalDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('professionals')
      .insert([
        {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          image: dto.image || null,
          bio: dto.bio || null,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Erro ao criar profissional: ${error.message}`,
      );
    }

    // Se tem especialidades, associar
    if (dto.specialty_ids && dto.specialty_ids.length > 0) {
      const specialtyLinks = dto.specialty_ids.map((specialtyId) => ({
        professional_id: data.id,
        specialty_id: specialtyId,
      }));

      await this.supabase
        .getClient()
        .from('professional_specialties')
        .insert(specialtyLinks);
    }

    return this.findOne(data.id);
  }

  async update(id: string, dto: UpdateProfessionalDto) {
    const updates: any = {};

    if (dto.name) updates.name = dto.name;
    if (dto.email) updates.email = dto.email;
    if (dto.phone) updates.phone = dto.phone;
    if (dto.image !== undefined) updates.image = dto.image;
    if (dto.bio !== undefined) updates.bio = dto.bio;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .getClient()
      .from('professionals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Erro ao atualizar profissional: ${error.message}`,
      );
    }

    return data;
  }

  async delete(id: string) {
    // Soft delete (marcar como inativo)
    const { error } = await this.supabase
      .getClient()
      .from('professionals')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Erro ao deletar profissional: ${error.message}`,
      );
    }

    return { message: 'Profissional deletado' };
  }

  /**
   * Obter horários disponíveis de um profissional
   */
  async getAvailableSlots(professionalId: string, date: string) {
    // Obter horário de funcionamento para o dia
    const dayOfWeek = new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
    });

    const { data: hours } = await this.supabase
      .getClient()
      .from('opening_hours')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!hours) {
      return { available: false, message: 'Profissional não trabalha neste dia' };
    }

    // Obter reservas já agendadas para este dia
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);

    const { data: bookings } = await this.supabase
      .getClient()
      .from('bookings')
      .select('scheduled_at, end_time')
      .eq('professional_id', professionalId)
      .gte('scheduled_at', new Date(startOfDay).toISOString())
      .lte('scheduled_at', new Date(endOfDay).toISOString())
      .eq('status', 'confirmed');

    // Gerar slots disponíveis (ex: a cada 30 min)
    const slots: string[] = [];
    const start = new Date(`${date}T${hours.start_time}`);
    const end = new Date(`${date}T${hours.end_time}`);
    const slotDuration = 30; // minutos

    while (start < end) {
      const slotEnd = new Date(start.getTime() + slotDuration * 60000);

      // Verificar se slot não conflita com reservas
      const isAvailable = !bookings?.some((booking) => {
        const bookingStart = new Date(booking.scheduled_at);
        const bookingEnd = new Date(booking.end_time);
        return start < bookingEnd && slotEnd > bookingStart;
      });

      if (isAvailable) {
        slots.push(start.toISOString());
      }

      start.setMinutes(start.getMinutes() + slotDuration);
    }

    return { available: slots.length > 0, slots };
  }
}
```

### 3. ServicesService

**Arquivo:** `apps/api/src/modules/services/services.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/integrations/supabase/supabase.service';
import { CreateServiceDto, UpdateServiceDto } from '../dto';

@Injectable()
export class ServicesService {
  constructor(private supabase: SupabaseService) {}

  async findAll(category?: string) {
    let query = this.supabase.getClient().from('services').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw new BadRequestException(`Erro ao buscar serviços: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Serviço ${id} não encontrado`);
    }

    return data;
  }

  async create(dto: CreateServiceDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('services')
      .insert([
        {
          name: dto.name,
          description: dto.description || null,
          price: dto.price,
          duration: dto.duration,
          category: dto.category || 'general',
          image: dto.image || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao criar serviço: ${error.message}`);
    }

    return data;
  }

  async update(id: string, dto: UpdateServiceDto) {
    const updates: any = {};

    if (dto.name) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.price !== undefined) updates.price = dto.price;
    if (dto.duration !== undefined) updates.duration = dto.duration;
    if (dto.category) updates.category = dto.category;
    if (dto.image !== undefined) updates.image = dto.image;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .getClient()
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Erro ao atualizar serviço: ${error.message}`,
      );
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Erro ao deletar serviço: ${error.message}`);
    }

    return { message: 'Serviço deletado' };
  }
}
```

### 4. GalleryService

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/integrations/supabase/supabase.service';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from '../dto';

@Injectable()
export class GalleryService {
  constructor(private supabase: SupabaseService) {}

  async findAll(category?: string) {
    let query = this.supabase
      .getClient()
      .from('gallery')
      .select('*, professional_id(name, image)')
      .eq('is_published', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw new BadRequestException(`Erro ao buscar galeria: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('gallery')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Imagem ${id} não encontrada`);
    }

    return data;
  }

  async create(dto: CreateGalleryImageDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('gallery')
      .insert([
        {
          professional_id: dto.professional_id,
          image_url: dto.image_url,
          title: dto.title || null,
          description: dto.description || null,
          category: dto.category || 'general',
          is_published: dto.is_published || false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao criar imagem: ${error.message}`);
    }

    return data;
  }

  async update(id: string, dto: UpdateGalleryImageDto) {
    const updates: any = {};

    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.is_published !== undefined) updates.is_published = dto.is_published;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .getClient()
      .from('gallery')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao atualizar imagem: ${error.message}`);
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Erro ao deletar imagem: ${error.message}`);
    }

    return { message: 'Imagem deletada' };
  }
}
```

### 5. TestimonialsService

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '@/integrations/supabase/supabase.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from '../dto';

@Injectable()
export class TestimonialsService {
  constructor(private supabase: SupabaseService) {}

  async findAll(isApproved?: boolean) {
    let query = this.supabase.getClient().from('testimonials').select('*');

    if (isApproved !== undefined) {
      query = query.eq('is_approved', isApproved);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw new BadRequestException(
        `Erro ao buscar depoimentos: ${error.message}`,
      );
    }

    return data || [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Depoimento ${id} não encontrado`);
    }

    return data;
  }

  async create(dto: CreateTestimonialDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('testimonials')
      .insert([
        {
          client_name: dto.client_name,
          client_email: dto.client_email,
          rating: dto.rating,
          message: dto.message,
          professional_id: dto.professional_id || null,
          service_id: dto.service_id || null,
          is_approved: false, // Moderar depoimentos
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Erro ao criar depoimento: ${error.message}`,
      );
    }

    return data;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const updates: any = {};

    if (dto.rating !== undefined) updates.rating = dto.rating;
    if (dto.message !== undefined) updates.message = dto.message;
    if (dto.is_approved !== undefined) updates.is_approved = dto.is_approved;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .getClient()
      .from('testimonials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(
        `Erro ao atualizar depoimento: ${error.message}`,
      );
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(
        `Erro ao deletar depoimento: ${error.message}`,
      );
    }

    return { message: 'Depoimento deletado' };
  }
}
```

## Testar Endpoints Localmente

### 1. Iniciar Backend em Desenvolvimento

```bash
cd apps/api
npm run dev
```

Expected output:
```
[Nest] 12345  - 01/20/2025, 10:30 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/20/2025, 10:30 AM     LOG [InstanceLoader] SupabaseModule dependencies initialized
[Nest] 12345  - 01/20/2025, 10:30 AM     LOG [RoutesResolver] BookingsController {...}
[Nest] 12345  - 01/20/2025, 10:30:44.123 LOG [NestApplication] Nest application successfully started on port 3333
```

### 2. Testar Health Check

```bash
curl http://localhost:3333/health
# Expected: {"status":"ok"}
```

### 3. Testar GET (Bookings)

```bash
curl http://localhost:3333/api/v1/bookings
# Expected: [{"id":"booking_1","client_name":"João","status":"pending",...}]

# Com filtro
curl "http://localhost:3333/api/v1/bookings?status=confirmed"
```

### 4. Testar POST (Criar Profissional)

```bash
curl -X POST http://localhost:3333/api/v1/professionals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria@salon.com",
    "phone": "(11) 99999-8888",
    "specialties": ["corte", "coloração"]
  }'

# Expected: {"id":"prof_123","name":"Maria Silva",...}
```

### 5. Testar com JWT (Admin Endpoints)

```bash
# Primeiro, fazer login
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@salon.com",
    "password": "admin123"
  }'

# Response: {"token":"eyJhbGc..."}

# Usar token em requisição protegida
curl http://localhost:3333/api/v1/admin/bookings \
  -H "Authorization: Bearer eyJhbGc..."

# Expected: Lista de reservas para admin
```

## Dados de Teste

Inserir dados de teste no Supabase:

```sql
-- Tabela: professionals
INSERT INTO professionals (name, email, phone, image, bio, is_active) VALUES
  ('Ana Silva', 'ana@salon.com', '(11) 99999-1111', 'https://...', 'Estilista profissional com 10 anos de experiência', true),
  ('Maria Santos', 'maria@salon.com', '(11) 99999-2222', 'https://...', 'Especialista em coloração', true),
  ('Carlos Oliveira', 'carlos@salon.com', '(11) 99999-3333', NULL, 'Barbeiro com experiência', true);

-- Tabela: services
INSERT INTO services (name, description, price, duration, category) VALUES
  ('Corte Masculino', 'Corte profissional para homens', 50.00, 30, 'cabelo'),
  ('Corte Feminino', 'Corte profissional para mulheres', 80.00, 60, 'cabelo'),
  ('Coloração', 'Coloração completa do cabelo', 150.00, 90, 'cabelo'),
  ('Escova', 'Escova progressiva ou alisamento', 200.00, 120, 'cabelo'),
  ('Sobrancelha', 'Design e modelagem de sobrancelha', 30.00, 20, 'acessórios');

-- Tabela: gallery (via admin)
INSERT INTO gallery (professional_id, image_url, title, category, is_published) VALUES
  ('prof_1', 'https://images.unsplash.com/...', 'Corte Moderno', 'cabelo', true),
  ('prof_2', 'https://images.unsplash.com/...', 'Coloração Vermelha', 'cabelo', true);

-- Tabela: testimonials
INSERT INTO testimonials (client_name, client_email, rating, message, is_approved) VALUES
  ('João Silva', 'joao@email.com', 5, 'Excelente atendimento! Voltarei com certeza.', true),
  ('Paula Costa', 'paula@email.com', 5, 'Profissional muito atenciosa, resultado perfeito!', true);
```

## Checklist de Implementação

- [ ] BookingsService implementado com dados reais do Supabase
- [ ] ProfessionalsService implementado com dados reais
- [ ] ServicesService implementado com dados reais
- [ ] GalleryService implementado com dados reais
- [ ] TestimonialsService implementado com dados reais
- [ ] Todos os endpoints testados com curl
- [ ] JWT auth testado com admin
- [ ] Dados de teste inseridos no Supabase
- [ ] Tratamento de erros implementado
- [ ] Validação de DTOs implementada
- [ ] CORS habilitado para frontend
- [ ] Logs implementados para debugging

## Próximos Passos

1. ✅ Implementar todas as 5 services
2. ✅ Testar endpoints localmente
3. ✅ Frontend integrá-los via API client
4. ✅ Deploy no Vercel (staging)
5. ✅ QA testing
6. ✅ Deploy produção

## Debugging

Se um endpoint retornar erro:

```bash
# 1. Verificar se Supabase está acessível
curl https://your-project.supabase.co/rest/v1/

# 2. Verificar credenciais .env
cat apps/api/.env.development

# 3. Verificar logs do backend
# Terminal onde rodando "npm run dev" mostra logs em tempo real

# 4. Usar Postman para testar com melhor UX
# https://www.postman.com/
# Importar endpoints da API
```

## Suporte

Se um endpoint continuar com erro:
- Abrir issue com stack trace
- Incluir: endpoint, método, status code
- Incluir: resposta de erro do Supabase
- Incluir: versão do NestJS e Node.js
