# Prompt De Handoff Completo Para Backend E Evolucao Whitelabel

Copie e cole o prompt abaixo em outra IA ou em outro repositorio. Ele foi escrito para transferir o contexto real do projeto Feitico, explicar o estado atual do produto, preservar os comportamentos que ja existem no frontend e orientar a criacao de um backend proprio com visao futura de whitelabel.

## Prompt Pronto Para Uso

Voce vai atuar como arquiteto de software, engenheiro backend senior, especialista em modelagem de dominio e em migracao de sistemas frontend-first para arquitetura com backend dedicado. Sua tarefa e entender profundamente o sistema descrito abaixo e, a partir dele, projetar e implementar um backend novo, mantendo compatibilidade funcional com o produto atual e preparando a base para futura evolucao para whitelabel/multi-tenant.

Nao me entregue uma resposta superficial. Nao resuma demais. Nao invente features aleatorias. Nao ignore regras ja existentes no sistema atual. Preserve o comportamento real do produto de hoje e, ao mesmo tempo, indique como ele deve evoluir com seguranca para um backend mais robusto e para um modelo whitelabel escalavel.

Seu trabalho deve partir do principio de que o frontend atual existe, funciona, e precisa ser entendido como a fonte da verdade do comportamento de negocio visivel ao usuario. O backend novo deve nascer para absorver as responsabilidades que hoje estao distribuidas entre frontend, Supabase, SQL, RLS, triggers e uma edge function.

## 1. Identidade Do Projeto

Nome do projeto: Feitico

Tipo de produto atual: aplicacao de agendamento e gestao para salao unico

Contexto de negocio atual:
- Existe uma landing page publica para clientes
- Existe um painel administrativo em `/admin`
- O produto hoje atende um unico salao
- Nao existe superadmin operacional no produto atual
- Nao existe backend Node/Nest/Express proprio nesta base atual
- A logica server-side atual esta espalhada entre Supabase, SQL, RLS, trigger, RPC e uma edge function

Objetivo desta transferencia:
- Entender completamente o estado atual do produto
- Descrever como ele funciona hoje
- Criar um backend proprio em outro repositorio
- Preparar a arquitetura para evolucao futura em modelo whitelabel
- Identificar o que no produto atual e single-tenant e o que precisa ser abstraido para virar multi-tenant no futuro

## 2. Stack Atual E Estrutura Tecnica

Stack atual do frontend:
- React 18
- TypeScript
- Vite
- React Router DOM
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- sonner para toasts
- date-fns
- vite-plugin-pwa

Stack atual de dados e autenticacao:
- Supabase JS Client
- Supabase Auth
- PostgreSQL no Supabase
- Supabase Storage
- Supabase Realtime
- RLS nas tabelas
- Uma edge function para push notification

Arquitetura atual do app:
- `src/pages/Index.tsx`: landing page publica
- `src/pages/Admin.tsx`: painel admin em uma unica rota com tabs
- `src/services/*`: camada de dominio e acesso a dados
- `src/hooks/*`: wrappers de React Query
- `src/components/landing/*`: componentes da landing
- `src/components/admin/*`: componentes do painel
- `src/integrations/supabase/client.ts`: instancia unica do Supabase
- `src/integrations/supabase/types.ts`: tipos gerados do banco
- `supabase/migrations/*`: evolucao do schema
- `supabase/functions/notify-admin-push/index.ts`: edge function de push para novos agendamentos

## 3. Rotas E Superficie De Produto

Rotas existentes:
- `/`: landing publica
- `/admin`: painel administrativo

Nao existem subrotas complexas no admin. O painel inteiro e controlado por tabs dentro da pagina `Admin.tsx`.

Rotas fallback:
- qualquer rota desconhecida redireciona para `/`

## 4. Funcionamento Da Landing Publica

A landing publica e composta por estas secoes:
- Header
- Hero
- Services
- Gallery
- About
- VideoSection
- Testimonials
- Booking
- Footer

### 4.1 Header

O header:
- exibe logo do salao, se existir
- se nao houver logo, exibe o nome do salao
- tem navegacao por ancora para secoes da propria landing
- itens atuais do menu:
  - Inicio
  - Servicos
  - Galeria
  - Sobre
  - Depoimentos
  - Agendar
- possui menu mobile com toggle
- adiciona efeito visual diferente quando a pagina rola

### 4.2 Hero

O Hero:
- usa imagem de fundo dinamica do salao (`hero_image_url`) ou fallback local
- usa textos dinamicos do salao:
  - `hero_title`
  - `hero_subtitle`
  - `hero_description`
- tem dois CTAs:
  - ir para `#booking`
  - ir para `#services`
- funciona como a abertura comercial da pagina

### 4.3 Services

A secao de servicos:
- carrega servicos ativos do salao
- separa servicos normais e combos (`is_combo`)
- mostra imagem, nome, descricao, preco e duracao
- botao "Agendar" em cada card

Comportamento importante:
- ao clicar em "Agendar" em um servico, a landing salva esse servico como preselecionado
- depois faz scroll suave ate a secao de booking
- o booking usa essa pre-selecao como ponto de partida

### 4.4 Gallery

A galeria:
- e renderizada somente se houver imagens
- busca `gallery_images`
- exibe caption se existir
- e publica

### 4.5 About

A secao "Sobre":
- usa `about_image_url` ou fallback local
- usa `about_title` e `about_text` se existirem
- caso nao existam, usa textos padrao estaticos

### 4.6 VideoSection

A secao de video:
- so aparece se `video_url` estiver preenchida
- tenta extrair ID de YouTube
- se for YouTube, renderiza `iframe`
- se nao for, renderiza tag `video`

### 4.7 Testimonials

Depoimentos:
- so aparecem se houver depoimentos ativos
- exibem autor, nota e conteudo
- sao publicos

### 4.8 Booking Publico

O Booking e o coracao do produto para o cliente. Ele implementa um funil guiado com etapas.

Fluxo do booking:
1. selecionar profissional
2. selecionar servicos
3. selecionar data
4. selecionar horario
5. preencher nome e telefone
6. revisar resumo
7. confirmar agendamento
8. redirecionar para WhatsApp

Comportamentos importantes do booking:
- usa realtime para atualizar horarios disponiveis quando outro booking entra
- quando o usuario clica em um servico na secao Services, esse servico pode entrar como preselecionado
- os servicos mostrados no booking dependem do profissional selecionado
- o sistema considera overrides por profissional:
  - preco customizado
  - duracao customizada
  - buffer customizado
- o usuario pode selecionar varios servicos
- o total considera:
  - preco total
  - duracao total
  - buffer total
  - tempo total ocupado na agenda
- a busca de horarios disponiveis leva em conta:
  - disponibilidade semanal do profissional
  - excecoes do profissional
  - bloqueios
  - folgas
  - horarios especiais
  - bookings ja existentes
  - margem operacional
  - horario atual, quando a data e hoje
- o formulario persiste dados do cliente em `localStorage`
- ao informar telefone e sair do campo, o sistema tenta reconhecer cliente ja existente por telefone
- se encontrar cliente, autopreenche o nome preferencial

Campos principais do formulario publico:
- `customer_name`
- `customer_phone`
- `professional_id`
- `services[]`
- `booking_date`
- `booking_time`

Ao confirmar:
- o frontend calcula:
  - `total_price`
  - `total_duration`
  - `total_buffer_minutes`
  - `total_occupied_minutes`
  - `commission_amount`
  - `profit_amount`
- envia para `createBooking`
- status default hoje e `pending`
- booking_type publico padrao e `scheduled`

Depois da criacao:
- dispara toast de sucesso
- limpa persistencia local do form
- gera mensagem estruturada de WhatsApp
- redireciona diretamente para WhatsApp com logica de detecao mobile/web:
  - mobile: `wa.me`
  - desktop: `web.whatsapp.com/send`

Observacao importante:
- o fluxo do booking publico ja foi ajustado para evitar ponte indesejada do `api.whatsapp.com`
- essa logica direta hoje e uma referencia importante para qualquer backend futuro que preserve a UX

### 4.9 Footer

O footer:
- exibe nome do salao
- exibe frase institucional
- exibe redes sociais
- exibe endereco e telefone
- exibe horarios de funcionamento a partir de `opening_hours`
- tem link para contato com o desenvolvedor via WhatsApp
- esse link usa a mesma logica direta mobile/web do booking
- tem link para `/admin`

## 5. Funcionamento Do Painel Admin

O admin esta concentrado em `src/pages/Admin.tsx`.

### 5.1 Autenticacao Admin

O admin hoje usa Supabase Auth com email e senha.

Fluxo atual:
- `supabase.auth.getSession()` para restaurar sessao
- `supabase.auth.onAuthStateChange()` para reagir a mudancas
- login com `signInWithPassword`
- logout com `signOut`

Restricao opcional:
- existe env `VITE_ADMIN_ALLOWED_EMAILS`
- se preenchida, somente emails presentes nela podem usar o admin
- se vazia, qualquer usuario autenticado pode entrar

Sessao:
- o app usa storage customizado
- existe limite local de sessao e de inatividade
- configurado por:
  - `VITE_AUTH_STORAGE_KEY`
  - `VITE_AUTH_SESSION_MAX_DAYS`
  - `VITE_AUTH_INACTIVITY_HOURS`

### 5.2 Realtime E Alertas No Admin

O admin tambem tem comportamento operacional em tempo real:
- se entrar novo booking, `useRealtimeBookings` invalida queries
- o admin toca um som local via Web Audio API
- exibe toast com nome do cliente e horario
- incrementa contador de novos agendamentos
- altera o `document.title` para refletir esse contador

Existe ainda suporte a push notifications:
- inscricao em push via Service Worker
- armazenamento de subscription em `push_subscriptions`
- edge function `notify-admin-push` envia push quando booking e criado

### 5.3 Tabs Do Admin

Tabs atuais:
- Avisos
- Dashboard
- Agenda
- Salao
- Profissionais
- Servicos
- Agendamentos
- Disponibilidade
- Galeria
- Depoimentos
- Clientes

### 5.4 Aba Avisos

A aba Avisos funciona como central operacional simplificada.

Ela agrupa bookings em tres buckets:
- `pending`: bookings pendentes de confirmacao
- `todayConfirmed`: bookings confirmados para hoje
- `overdueConfirmed`: bookings confirmados em datas anteriores e ainda nao concluidos

Acoes disponiveis:
- confirmar booking pendente
- cancelar booking pendente
- enviar lembrete por WhatsApp
- concluir booking atrasado
- cancelar booking atrasado

Comportamento de lembrete:
- abre WhatsApp com mensagem simples de lembrete
- se enviado, registra `reminder_sent_at`

### 5.5 Dashboard

O dashboard resume operacao e financeiro.

Cards principais:
- total de agendamentos
- total de profissionais
- total de servicos
- total de pendentes

Secao financeira:
- faturamento
- comissoes
- lucro liquido
- concluidos
- a receber (confirmados)

Filtro temporal:
- `dateFrom`
- `dateTo`

Bloco por profissional:
- quantidade de atendimentos
- faturamento
- comissao
- lucro
- ticket medio
- minutos ocupados

Regras atuais do dashboard:
- receita principal hoje considera bookings `completed`
- `pendingRevenue` considera `confirmed`
- estatisticas por profissional agregam bookings `confirmed` e `completed` no intervalo

### 5.6 Agenda

A aba Agenda e uma visao de calendario.

Modos:
- mes
- semana
- dia

Filtros:
- por profissional

Funcoes:
- navegar entre datas
- voltar para hoje
- visualizar bookings por dia
- confirmar/cancelar/concluir
- enviar lembrete

Observacao importante:
- a Agenda ainda usa alguns acessos e adaptacoes mais proximas da view
- em alguns pontos usa cast mais fraco para dados de booking

### 5.7 Salao

A aba Salao concentra dados institucionais, branding e textos da landing.

Campos principais:
- `name`
- `phone`
- `whatsapp`
- `address`
- `about_text`
- `logo_url`
- `hero_image_url`
- `video_url`
- `instagram`
- `facebook`
- `hero_title`
- `hero_subtitle`
- `hero_description`
- `about_title`
- `tagline`
- `about_image_url`
- `seo_title`
- `seo_description`
- `opening_hours`

Comportamentos importantes:
- carrega o primeiro salao ativo se nenhum `salonId` for informado
- persiste rascunho no `localStorage`
- separa DDI e numero nacional do WhatsApp
- normaliza numero para padrao compativel com WhatsApp
- faz update se ja existe `salon.id`
- faz insert se nao existe

### 5.8 Profissionais

Essa aba hoje faz muita coisa.

Parte 1: CRUD de profissionais
- nome
- foto
- tipo de comissao (`percentage` ou `fixed`)
- valor de comissao
- flag `active`

Parte 2: configuracao do profissional selecionado
- disponibilidade recorrente
- excecoes
- servicos habilitados

Subarea disponibilidade:
- cria linhas por dia da semana
- salva `start_time`, `end_time`
- pode remover disponibilidades

Subarea excecoes:
- cria excecoes por data
- tipos:
  - `day_off`
  - `blocked`
  - `custom_hours`
- pode adicionar motivo
- pode remover

Subarea servicos:
- vincula servicos ao profissional
- pode desligar ou ligar vinculo
- pode configurar overrides:
  - `custom_price`
  - `custom_duration_minutes`
  - `custom_buffer_minutes`
  - `commission_override_type`
  - `commission_override_value`

Observacao de arquitetura muito importante:
- `AdminProfessionals.tsx` ainda acessa Supabase diretamente em varios pontos
- essa aba ainda nao esta totalmente alinhada ao padrao service + hook
- isso e um ponto relevante para refatoracao no backend novo e para limpeza futura do frontend

### 5.9 Servicos

CRUD completo de servicos.

Campos:
- nome
- descricao
- preco
- duracao
- buffer_minutes
- image_url
- category
- `is_combo`
- `active`
- `sort_order`

Comportamentos:
- validacao de duracao minima
- exibe tempo total na agenda = duracao + margem
- busca por nome
- pagina visual "ver mais"
- permite editar e excluir

### 5.10 Agendamentos

Essa aba e a operacao do dia por profissional e tambem permite criar bookings manuais.

Recursos:
- filtro por data
- filtro por status
- visualizacao agrupada por profissional
- mapa de ocupacao do dia em intervalos de 5 minutos
- criacao manual de booking
- acoes operacionais por booking

Formulario de booking manual:
- `customer_name`
- `customer_phone`
- `professional_id`
- `booking_date`
- `booking_time`
- `booking_type`
- `status`
- `notes`
- `service_ids`

Tipos de booking:
- `scheduled`
- `walk_in`
- `waitlist`

Regra importante:
- `waitlist` pode existir sem horario
- outros tipos exigem horario

No booking manual o sistema:
- carrega servicos disponiveis do profissional
- monta snapshot efetivo de servicos com overrides
- calcula valores e tempos
- calcula comissao do profissional
- calcula lucro
- chama `createBooking`

Acoes por booking:
- confirmar
- cancelar
- concluir
- enviar lembrete por WhatsApp

Observacao importante:
- a aba Agendamentos ja usa mais fortemente services/hooks
- ela e uma referencia melhor de arquitetura que Profissionais e Disponibilidade

### 5.11 Disponibilidade

Essa aba oferece outra forma de editar a disponibilidade operacional dos profissionais.

Ela permite:
- escolher profissional ativo
- ligar/desligar dias da semana
- editar horarios de inicio/fim
- salvar horarios semanais
- cadastrar excecoes futuras
- remover excecoes

Observacao importante:
- `AdminAvailability.tsx` ainda faz acesso direto ao Supabase
- isso tambem e divida tecnica arquitetural
- existe sobreposicao funcional parcial com a aba Profissionais
- essa duplicidade deve ser considerada no redesenho do backend e do dominio

### 5.12 Galeria

Recursos:
- upload de imagem
- caption
- `sort_order`
- listagem em grid
- exclusao
- paginacao visual com "Carregar mais"

Upload:
- bucket `salon-images`
- valida imagem
- limite 5MB
- gera nome por pasta e timestamp
- usa URL publica do arquivo

### 5.13 Depoimentos

Recursos:
- criar depoimento
- excluir depoimento
- listar inclusive ativos/inativos no admin

Campos:
- `author_name`
- `author_image`
- `content`
- `rating`
- `active`

### 5.14 Clientes

A aba Clientes usa paginacao infinita e reconhecimento por telefone.

Exibe:
- nome preferido
- telefone mascarado
- quantidade de agendamentos confirmados/concluidos
- total gasto
- ticket medio
- ultima visita
- atalho de WhatsApp

Busca:
- por nome
- por telefone

Logica importante:
- o cadastro de clientes nao e manual
- o cliente nasce automaticamente quando um booking e criado
- isso e feito via funcao SQL `upsert_client_by_phone`

## 6. Camada De Dominio Atual: Services

Os `services` atuais sao a melhor aproximacao da regra de negocio organizada. Entenda cada um deles como contrato funcional do sistema.

### 6.1 `salonService.ts`

Funcoes:
- `getSalon(salonId?)`
  - se recebe ID, busca aquele salao ativo
  - se nao recebe, busca o primeiro salao ativo por ordem de criacao
- `getPrimarySalonId()`
  - retorna o ID do salao principal

Implicacao:
- o app atual assume, na pratica, um salao principal
- essa e uma das maiores marcas do single-tenant atual

### 6.2 `servicesService.ts`

Funcoes:
- `getServices(salonId, options?)`
  - lista servicos do salao
  - por padrao, so ativos
- `createService(payload)`
- `updateService(id, payload)`
- `deleteService(id)`
- `saveService(payload)`
  - decide entre insert e update

### 6.3 `professionalService.ts`

Funcoes de profissionais:
- `getProfessionals(salonId, options?)`
- `createProfessional(payload)`
- `updateProfessional(id, payload)`
- `deleteProfessional(id)`

Funcoes de vinculo profissional-servico:
- `getProfessionalServices(professionalId, options?)`
- `createProfessionalServiceLink(payload)`
- `updateProfessionalServiceLink(id, payload)`
- `deleteProfessionalServiceLink(id)`

Funcoes de disponibilidade:
- `getProfessionalAvailability(professionalId, options?)`
- `getAvailabilityForProfessionals(professionalIds, options?)`
- `createProfessionalAvailability(payload)`
- `updateProfessionalAvailability(id, payload)`
- `deleteProfessionalAvailability(id)`

Funcoes de excecoes:
- `getProfessionalExceptions(professionalId, options?)`
- `createProfessionalException(payload)`
- `deleteProfessionalException(id)`

### 6.4 `bookingService.ts`

Esse service concentra a regra mais critica do negocio.

Funcoes principais:
- `getBookings(salonId, options?)`
  - filtra por data unica ou faixa
  - filtra por status
  - pagina com `limit/offset`
- `createBooking(payload)`
  - executa pre-check server-side de conflito via RPC `check_booking_conflict`
  - insere booking
  - trata erro `BOOKING_CONFLICT`
  - chama `upsert_client_by_phone` em fire-and-forget
  - atualiza `client_id` no booking criado
  - dispara edge function `notify-admin-push`
- `getAvailableSlots(professionalId, date, totalOccupiedMinutes)`
  - usa disponibilidade semanal
  - usa excecoes
  - ignora dia sem disponibilidade
  - respeita folga total
  - respeita bloqueios parciais
  - respeita horario especial (`custom_hours`)
  - cruza bookings `pending` e `confirmed`
  - avanca de 5 em 5 minutos
  - impede horarios passados no dia atual
  - aplica `OVERTIME_MARGIN = 60`
- `calculateCommission(totalPrice, commissionType, commissionValue)`
  - percentual ou fixo
- `generateDirectWhatsAppUrl(info)`
  - decide mobile vs desktop
  - usa `wa.me` no mobile
  - usa `web.whatsapp.com/send` no desktop
- `generateWhatsAppMessage(info)`
  - monta mensagem operacional de agendamento
  - usa o telefone do salao ou fallback

### 6.5 `notificationService.ts`

Funcoes:
- `buildReminderMessage(booking)`
  - monta mensagem simples de lembrete
- `getNotificationBuckets(salonId, today)`
  - retorna `pending`, `todayConfirmed`, `overdueConfirmed`
- `markReminderSent(bookingId, sentAt?)`
  - grava `reminder_sent_at`
- `updateBookingStatus(bookingId, status)`

### 6.6 `adminDashboardService.ts`

Funcao principal:
- `getDashboardOverview(salonId, dateFrom, dateTo)`

Ela calcula:
- contagem total de bookings
- contagem total de servicos
- contagem de pendentes
- contagem de profissionais
- faturamento
- comissoes
- lucro
- quantidade de concluidos
- receita pendente dos confirmados
- agregado por profissional

### 6.7 `galleryService.ts`

Funcoes:
- `getGallery(salonId)`
- `getGalleryPage(salonId, page, pageSize)`
- `createGalleryImage(payload)`
- `deleteGalleryImage(id)`

### 6.8 `testimonialService.ts`

Funcoes:
- `getTestimonials(salonId, options?)`
- `createTestimonial(payload)`
- `deleteTestimonial(id)`

### 6.9 `clientService.ts`

Funcoes:
- `buildClientWhatsAppUrl(phone)`
- `lookupClientByPhone(salonId, phone)`
- `getClientsPage(salonId, page, pageSize)`

Logica importante:
- `lookupClientByPhone` normaliza telefone removendo nao-digitos
- `getClientsPage` pagina clientes e depois agrega stats a partir dos bookings
- stats considerados:
  - quantidade
  - ultima data
  - total gasto

## 7. Hooks Atuais

A camada de hooks e majoritariamente um adapter para React Query.

Hooks mais importantes:
- `useSalon`
- `useServices`
- `useAdminServices`
- `useProfessionals`
- `useProfessionalServices`
- `useProfessionalAvailability`
- `useAvailabilityForProfessionals`
- `useProfessionalExceptions`
- `useBookings`
- `useAvailableSlots`
- `useCreateBooking`
- `useRealtimeBookings`
- `useAdminNotifications`
- `useAdminNotificationsRealtime`
- `useBookingStatusMutation`
- `useReminderSentMutation`
- `useInfiniteClients`
- `useGallery`
- `useInfiniteAdminGallery`
- `useTestimonials`
- `useAdminDashboard`

Padrao desejado do sistema atual:
- hooks sem regra pesada
- services com logica

Padrao real atual:
- parcialmente cumprido
- ainda existe violacao em componentes como `AdminProfessionals` e `AdminAvailability`

## 8. Modelo De Dados Atual

### 8.1 Tabelas Core

`salons`
- `id`
- `name`
- `slug`
- `logo_url`
- `hero_image_url`
- `primary_color`
- `phone`
- `whatsapp`
- `address`
- `about_text`
- `video_url`
- `instagram`
- `facebook`
- `opening_hours` JSONB
- `active`
- `created_at`
- `updated_at`
- depois foram adicionados campos dinamicos de landing/SEO:
  - `hero_title`
  - `hero_subtitle`
  - `hero_description`
  - `about_title`
  - `about_image_url`
  - `tagline`
  - `seo_title`
  - `seo_description`

`services`
- `id`
- `salon_id`
- `name`
- `description`
- `price`
- `duration`
- `buffer_minutes`
- `image_url`
- `category`
- `is_combo`
- `active`
- `sort_order`
- `created_at`

`bookings`
- `id`
- `salon_id`
- `professional_id`
- `client_id`
- `customer_name`
- `customer_phone`
- `services` JSONB snapshot
- `total_price`
- `total_duration`
- `total_buffer_minutes`
- `total_occupied_minutes`
- `commission_amount`
- `profit_amount`
- `booking_date`
- `booking_time`
- `booking_type`
- `status`
- `notes`
- `created_at`
- `reminder_sent_at`

`professionals`
- `id`
- `salon_id`
- `name`
- `photo_url`
- `active`
- `commission_type`
- `commission_value`
- `created_at`

`professional_services`
- `id`
- `professional_id`
- `service_id`
- `custom_price`
- `custom_duration_minutes`
- `custom_buffer_minutes`
- `commission_override_type`
- `commission_override_value`
- `active`

`professional_availability`
- `id`
- `professional_id`
- `weekday`
- `start_time`
- `end_time`
- `active`

`professional_exceptions`
- `id`
- `professional_id`
- `date`
- `start_time`
- `end_time`
- `type`
- `reason`
- `created_at`

`gallery_images`
- `id`
- `salon_id`
- `image_url`
- `caption`
- `sort_order`
- `created_at`

`testimonials`
- `id`
- `salon_id`
- `author_name`
- `author_image`
- `content`
- `rating`
- `active`
- `created_at`

### 8.2 Tabelas Operacionais Mais Novas

`clients`
- `id`
- `salon_id`
- `phone_normalized`
- `preferred_name`
- `last_seen_at`
- `created_at`
- `updated_at`
- `merged_into_id`

`client_aliases`
- `id`
- `client_id`
- `alias_name`
- `usage_count`
- `last_used_at`

`push_subscriptions`
- `id`
- `salon_id`
- `endpoint`
- `p256dh`
- `auth`
- `device_label`
- `created_at`

### 8.3 Tabela Legada

`availability`
- tabela antiga de disponibilidade por salao/data
- ainda existe no schema
- porem a logica principal hoje usa `professional_availability` e `professional_exceptions`
- essa tabela legada precisa ser tratada com cuidado na migracao para backend proprio

## 9. Funcoes SQL, Trigger E Infra Server-Side Atual

### 9.1 `check_booking_conflict`

Funcao SQL que verifica conflito de agenda por profissional e horario.

Entradas:
- profissional
- data
- horario
- total de minutos ocupados
- ID a excluir em caso de update

Logica:
- walk-in sem horario nao conflita
- compara intervalo do booking novo contra bookings `pending` e `confirmed`
- usa `total_occupied_minutes` ou `total_duration`

### 9.2 `prevent_booking_conflict`

Trigger function usada em `bookings`.

Dispara:
- antes de insert
- antes de update relevante em booking

Se detectar conflito:
- gera excecao `BOOKING_CONFLICT`

### 9.3 `upsert_client_by_phone`

Funcao SQL `SECURITY DEFINER`.

Faz:
- normalizacao do telefone
- upsert em `clients`
- atualiza `last_seen_at`
- atualiza `preferred_name`
- registra alias em `client_aliases`
- retorna `client_id`

### 9.4 `notify-admin-push`

Edge function Supabase.

Faz:
- recebe `salon_id` e dados do booking
- le subscriptions de `push_subscriptions`
- usa web-push com VAPID
- envia push de novo agendamento
- remove subscriptions vencidas (`410` ou `404`)

## 10. Politicas De Seguranca E RLS Atuais

Estado atual de seguranca:
- varias tabelas possuem RLS habilitado
- varias policies de leitura publica existem para landing
- ha policies amplas de admin para usuarios autenticados

Leituras publicas principais:
- saloes ativos
- servicos ativos
- imagens da galeria
- depoimentos ativos
- bookings para calculo de disponibilidade
- profissionais ativos
- professional_services ativos
- professional_availability ativa

Problema conceitual para escalabilidade:
- as policies atuais sao suficientes para um app de salao unico
- elas ainda nao representam um modelo whitelabel robusto
- ha varios pontos com `USING (true)` ou acesso autenticado muito amplo
- isso precisa ser redesenhado em backend dedicado

## 11. PWA, Notificacoes E UX Operacional

O app atual tem preocupacao com uso como app instalado.

Recursos atuais:
- prompt de instalacao PWA
- instrucoes por navegador
- notificacao local de teste
- push subscription real via service worker
- badge/sonoridade operacional no admin
- persistencia de formularios no `localStorage`

Recursos importantes:
- `usePwaInstall`
- `usePwaNotifications`
- `PwaAssistant`
- `notificationSound.ts`
- `useFormPersistence`

## 12. Utilitarios E Regras Auxiliares Importantes

### 12.1 Telefone / WhatsApp

Arquivo chave: `src/lib/phone.ts`

Regras:
- remove caracteres nao numericos
- remove prefixo `00`
- remove zeros de tronco local
- injeta DDI padrao `55` quando numero brasileiro vier sem DDI
- retorna numero em formato adequado para WhatsApp

Observacao:
- o frontend ja contem bastante logica de normalizacao
- ao criar backend novo, idealmente essa logica deve existir do lado do dominio tambem

### 12.2 Session Storage Customizado

Arquivo: `authStorage.ts`

Ele:
- encapsula sessao em envelope versionado
- grava `createdAt`
- grava `lastUsedAt`
- grava `expiresAt`
- grava `inactivityExpiresAt`
- invalida sessao local expirada

## 13. Testes Atuais

Existe suite de testes com Vitest.

Arquivos principais:
- `src/test/phone.test.ts`
- `src/test/bookingService.test.ts`
- `src/test/adminContentServices.test.ts`
- `src/test/domainServices.test.ts`
- `src/test/ErrorBoundary.test.tsx`

Cobertura real hoje:
- telefone / normalizacao
- partes de booking service
- partes dos services administrativos
- dashboard
- clientes
- notificacoes
- ErrorBoundary

Estado geral:
- ja existe base minima de testes
- ainda nao ha cobertura realmente completa do produto inteiro
- backend novo deve nascer com testes melhores e mais sistemicos

## 14. Estado Atual Da Arquitetura: O Que Ja Esta Bom

Pontos positivos:
- existe separacao razoavel entre services e hooks em boa parte do sistema
- boa parte da regra de booking esta centralizada
- produto ja tem funcionalidades reais de operacao
- frontend ja reflete varios comportamentos de negocio maduros
- existe tratamento de conflito server-side no banco
- existe reconhecimento de cliente por telefone
- existe push notification funcional
- existe suporte a PWA
- o sistema ja saiu de uma SPA simples e esta mais modular
- o projeto ja removeu tabelas legadas de multitenancy/superadmin que nao faziam mais sentido na base single-tenant

## 15. Estado Atual Da Arquitetura: Dividas, Gaps E Pontos De Escala

Voce precisa considerar explicitamente estes problemas:

### 15.1 Backend Ausente

Hoje nao existe backend dedicado.

Consequencias:
- regras ficam parcialmente no frontend
- seguranca depende muito de RLS e do desenho atual do banco
- o frontend carrega responsabilidades demais

### 15.2 Violacoes Do Padrao Arquitetural

Apesar do padrao desejado ser `component -> hook -> service -> Supabase`, ainda existem telas com acesso direto ao Supabase:
- `AdminProfessionals.tsx`
- `AdminAvailability.tsx`
- autenticacao no `Admin.tsx`

Isso precisa ser levado em conta no redesenho.

### 15.3 Single-Tenant Forte

O produto atual e single-tenant de forma estrutural:
- `getSalon()` sem ID pega o primeiro salao ativo
- `getPrimarySalonId()` reforca essa ideia
- varias experiencias assumem um unico salao
- policies atuais nao foram desenhadas como isolamento real de tenants

### 15.4 Duplicidade De Conceito

Existe sobreposicao entre:
- aba Profissionais > disponibilidade/excecoes
- aba Disponibilidade

Isso sugere necessidade de consolidacao de UX e de contrato de backend.

### 15.5 Tabela Legada `availability`

Ainda existe tabela antiga `availability`.
- ela ja nao representa o centro do scheduling atual
- nao deve ser base da nova arquitetura
- precisa ser classificada como legado

### 15.6 WhatsApp Ainda Nao Totalmente Padronizado

O booking publico e o footer usam URL direta com detecao mobile/web.

Mas no admin ainda existem pontos com abertura direta via `wa.me/55...`:
- avisos
- agenda
- agendamentos

Idealmente o backend/novo dominio deve unificar essa estrategia.

### 15.7 RLS Ainda Nao E Modelo Whitelabel

Para whitelabel real sera preciso:
- tenant isolation serio
- ownership claro por conta, tenant, unidade e usuario
- revisao de auth, roles e claims
- separar acesso publico de acesso admin por tenant

## 16. O Que Voce Deve Entregar A Partir Deste Contexto

Com base em tudo acima, eu quero que voce:

1. Faca um diagnostico tecnico do sistema atual
2. Explique o que deve ser preservado exatamente
3. Identifique o que deve sair do frontend e ir para o backend
4. Projete um backend novo para esse produto
5. Projete a evolucao desse backend para whitelabel
6. Mostre como migrar do estado atual para o estado alvo sem quebrar o frontend

## 17. Escopo Esperado Da Sua Resposta

Sua resposta deve obrigatoriamente incluir:

### 17.1 Mapa Do Dominio

Quero um mapa claro dos dominios:
- salao/branding
- servicos
- profissionais
- agenda/disponibilidade
- bookings
- clientes
- notificacoes
- galeria
- depoimentos
- autenticacao/autorizacao
- tenant/whitelabel futuro

### 17.2 Proposta De Backend

Quero a proposta de backend com:
- stack sugerida
- estrutura de pastas
- modulos
- entidades
- services
- controllers ou routers
- jobs
- notificacoes
- autenticacao
- autorizacao
- integracao com banco
- estrategia de migracao dos dados atuais

### 17.3 Contratos De API

Quero endpoints/contratos para:
- landing publica
- configuracao do salao
- servicos
- profissionais
- professional_services
- professional_availability
- professional_exceptions
- bookings
- dashboard
- notificacoes
- clientes
- galeria
- depoimentos
- push subscriptions

### 17.4 Logica De Negocio

Quero que voce explicite como o backend deve implementar:
- calculo de slots
- conflito de agenda
- snapshot de servicos no booking
- calculo de comissao
- calculo de lucro
- reconhecimento de cliente por telefone
- lembretes
- auditoria recomendada
- idempotencia recomendada

### 17.5 Estrategia Whitelabel

Quero que voce proponha como sair de:
- salao unico

para:
- plataforma whitelabel

Considere:
- tenant
- tenant branding
- tenant settings
- usuarios por tenant
- possivel multi-unidade no futuro
- isolamento por tenant
- customizacao visual por tenant
- slug/domino por tenant
- SEO por tenant
- notificacoes por tenant
- storage por tenant
- billing futuro

### 17.6 Plano De Migracao

Quero um plano em fases:
- fase 1: backend para manter compatibilidade com produto atual
- fase 2: mover regras do frontend para o backend
- fase 3: endurecer auth e autorizacao
- fase 4: preparar multitenancy
- fase 5: habilitar whitelabel

### 17.7 Lista De Riscos

Quero os principais riscos:
- tecnicos
- de consistencia de dados
- de UX
- de migracao
- de seguranca
- de performance

## 18. Regras Que Voce Deve Respeitar

- Nao me entregue resposta abstrata demais
- Nao me entregue so conceitos de DDD sem amarrar no produto real
- Nao ignore as features que ja existem
- Nao remova o comportamento operacional do booking
- Nao remova o redirecionamento para WhatsApp
- Nao trate este sistema como se fosse genericamente um "marketplace"
- Nao invente superadmin obrigatorio se isso nao for necessario na fase inicial
- Preserve compatibilidade com o frontend atual sempre que isso for uma boa estrategia de transicao
- Diferencie claramente o estado atual do estado alvo
- Aponte explicitamente o que hoje e legado
- Aponte explicitamente o que hoje ja esta pronto para reaproveitamento

## 19. Formato Da Sua Resposta

Responda em secoes nesta ordem:

1. Leitura do sistema atual
2. Regras de negocio atuais preservadas
3. Problemas estruturais atuais
4. Arquitetura backend proposta
5. Modelo de dados alvo
6. Contratos de API
7. Fluxos criticos detalhados
8. Estrategia de migracao
9. Estrategia whitelabel
10. Riscos e recomendacoes finais

Seja especifico, tecnico e pratico. Assuma que este prompt sera a base de uma reengenharia real do produto.
