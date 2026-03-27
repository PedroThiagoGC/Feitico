import { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { useAvailableSlots, useCreateBooking, useRealtimeBookings, generateWhatsAppMessage, calculateCommission } from "@/hooks/useBooking";
import { useProfessionals, useProfessionalServices, useProfessionalAvailability } from "@/hooks/useProfessionals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Check, ChevronDown, Clock, Loader2, User, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Service } from "@/hooks/useServices";
import type { Salon } from "@/hooks/useSalon";
import { lookupClientByPhone } from "@/services/clientService";
import { cn, formatDuration } from "@/lib/utils";

const bookingSchema = z.object({
  customer_name: z.string().trim().min(2, "Nome é obrigatório").max(100),
  customer_phone: z.string().trim().min(10, "Telefone inválido").max(20),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingProps {
  salon: Salon | undefined;
  services: Service[] | undefined;
  preselectedServices?: Service[];
}

export default function Booking({ salon, services, preselectedServices }: BookingProps) {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const createBooking = useCreateBooking();

  // Realtime: auto-refresh slots when another person books
  useRealtimeBookings(salon?.id);

  const { data: professionals } = useProfessionals(salon?.id);
  const { data: proServices } = useProfessionalServices(selectedProfessionalId || undefined);
  const { data: proAvailability } = useProfessionalAvailability(selectedProfessionalId || undefined);

  // When preselectedServices changes (user clicked "Agendar" on a service card),
  // find which professional offers it and pre-select that professional
  useEffect(() => {
    if (preselectedServices && preselectedServices.length > 0) {
      // We'll clear services and let user pick after choosing professional
      setSelectedServices([]);
      setSelectedProfessionalId("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setShowConfirmation(false);
    }
  }, [preselectedServices]);

  // Disabled days based on professional availability
  const disabledDays = useMemo(() => {
    if (!proAvailability || proAvailability.length === 0) return undefined;
    const activeWeekdays = new Set(proAvailability.map((a) => a.weekday));
    return (date: Date) => {
      if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
      return !activeWeekdays.has(date.getDay());
    };
  }, [proAvailability]);

  // Services available for selected professional
  const availableServices = useMemo(() => {
    if (!services) return [];
    if (!selectedProfessionalId || !proServices) return [];
    const linkedIds = new Set(proServices.map((ps) => ps.service_id));
    return services.filter((s) => linkedIds.has(s.id));
  }, [services, selectedProfessionalId, proServices]);

  // When professional changes, remove services that are not available for the new professional
  useEffect(() => {
    if (!selectedProfessionalId || !proServices) return;
    const linkedIds = new Set(proServices.map((ps) => ps.service_id));
    setSelectedServices((prev) => prev.filter((s) => linkedIds.has(s.id)));
  }, [selectedProfessionalId, proServices]);

  function getEffectiveService(service: Service) {
    const override = proServices?.find((ps) => ps.service_id === service.id);
    return {
      id: service.id,
      name: service.name,
      price: override?.custom_price ?? Number(service.price),
      duration: override?.custom_duration_minutes ?? service.duration,
      buffer: override?.custom_buffer_minutes ?? service.buffer_minutes,
    };
  }

  const effectiveSelected = selectedServices.map(getEffectiveService);
  const totalDuration = effectiveSelected.reduce((a, s) => a + s.duration, 0);
  const totalBuffer = effectiveSelected.reduce((a, s) => a + s.buffer, 0);
  const totalOccupied = totalDuration + totalBuffer;
  const totalPrice = effectiveSelected.reduce((a, s) => a + s.price, 0);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    selectedProfessionalId || undefined,
    dateStr,
    totalOccupied
  );

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { customer_name: "", customer_phone: "" },
  });
  const { clearPersisted } = useFormPersistence(form, "booking-customer");

  const selectedProfessional = professionals?.find((p) => p.id === selectedProfessionalId);

  const toggleService = useCallback((service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
    setSelectedTime("");
    setShowConfirmation(false);
  }, []);

  function getCommissionInfo() {
    if (!selectedProfessionalId || !professionals) return { type: "percentage", value: 0 };
    const pro = professionals.find((p) => p.id === selectedProfessionalId);
    return { type: pro?.commission_type || "percentage", value: Number(pro?.commission_value || 0) };
  }

  async function handlePhoneLookup(phone: string) {
    if (!salon?.id) return;

    const client = await lookupClientByPhone(salon.id, phone);
    if (client?.preferred_name && !form.getValues("customer_name")) {
      form.setValue("customer_name", client.preferred_name, { shouldValidate: true });
      toast.info(`Bem-vindo de volta, ${client.preferred_name}!`);
    }
  }

  const customerName = form.watch("customer_name");
  const customerPhone = form.watch("customer_phone");

  const isReadyToConfirm = useMemo(() => {
    if (!customerName || customerName.trim().length < 2) return false;
    if (!customerPhone || customerPhone.trim().length < 10) return false;
    if (selectedServices.length === 0) return false;
    if (!selectedProfessionalId) return false;
    if (!selectedDate) return false;
    if (!selectedTime) return false;
    return true;
  }, [customerName, customerPhone, selectedServices, selectedProfessionalId, selectedDate, selectedTime]);

  const handleShowConfirmation = () => {
    if (!isReadyToConfirm) {
      if (!selectedProfessionalId) toast.error("Selecione um profissional");
      else if (selectedServices.length === 0) toast.error("Selecione pelo menos um serviço");
      else if (!selectedDate) toast.error("Selecione uma data");
      else if (!selectedTime) toast.error("Selecione um horário");
      else form.handleSubmit(() => {})();
      return;
    }
    setShowConfirmation(true);
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!salon?.id) { toast.error("Salão não encontrado"); return; }

    const { type: commType, value: commValue } = getCommissionInfo();
    const commissionAmount = calculateCommission(totalPrice, commType, commValue);
    const profitAmount = totalPrice - commissionAmount;

    const bookingData = {
      salon_id: salon.id,
      professional_id: selectedProfessionalId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      services: effectiveSelected,
      total_price: totalPrice,
      total_duration: totalDuration,
      total_buffer_minutes: totalBuffer,
      total_occupied_minutes: totalOccupied,
      commission_amount: commissionAmount,
      profit_amount: profitAmount,
      booking_date: format(selectedDate!, "yyyy-MM-dd"),
      booking_time: selectedTime,
      booking_type: "scheduled" as const,
    };

    try {
      await createBooking.mutateAsync(bookingData);
      toast.success("Agendamento realizado com sucesso!");
      clearPersisted();

      const whatsappUrl = generateWhatsAppMessage({
        booking: bookingData,
        salonName: salon?.name || "Salão",
        salonAddress: salon?.address || "",
        salonWhatsapp: salon?.whatsapp || undefined,
        salonPhone: salon?.phone || undefined,
        professionalName: selectedProfessional?.name || "",
      });
      window.location.assign(whatsappUrl);

      form.reset();
      setSelectedServices([]);
      setSelectedProfessionalId("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setShowConfirmation(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao realizar agendamento. Tente novamente.";
      toast.error(message);
    }
  };

  // Step indicators
  const currentStep = !selectedProfessionalId ? 1
    : !selectedServices.length ? 2
    : !selectedDate ? 3
    : !selectedTime ? 3
    : 5;

  return (
    <section id="booking" className="py-16 md:py-24 bg-background">
      <div className="container px-4 max-w-3xl">
        <div
          ref={ref}
          className={`text-center mb-8 md:mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
            Faça seu <span className="text-gradient-gold">Agendamento</span>
          </h2>
          <p className="font-body text-muted-foreground text-sm md:text-base">Escolha o profissional, serviços, data e horário</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Profissional", "Serviço", "Data", "Horário", "Confirmar"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                currentStep > i + 1 ? "bg-primary text-primary-foreground" :
                currentStep === i + 1 ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {currentStep > i + 1 ? "✓" : i + 1}
              </div>
              {i < 4 && <div className={`w-6 sm:w-10 h-0.5 ${currentStep > i + 1 ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-gold">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
              {/* Step 1: Professional */}
              <div>
                <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                  Selecione o profissional
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(professionals || []).map((pro) => (
                    <button
                      type="button"
                      key={pro.id}
                      onClick={() => {
                        setSelectedProfessionalId(pro.id);
                        setSelectedDate(undefined);
                        setSelectedTime("");
                        setShowConfirmation(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border transition-all font-body text-sm ${
                        selectedProfessionalId === pro.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      {pro.photo_url ? (
                        <img src={pro.photo_url} alt={pro.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center"><User className="w-5 h-5 md:w-6 md:h-6" /></div>
                      )}
                      <span className="font-medium text-xs md:text-sm text-center">{pro.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Services (only show after professional selection — filtered to enabled services) */}
              {selectedProfessionalId && proServices && (
                <div>
                  <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    Selecione os serviços
                  </h4>
                  {availableServices.length === 0 ? (
                    <p className="text-muted-foreground font-body text-sm p-4 bg-secondary rounded-lg">
                      Este profissional ainda não tem serviços habilitados.
                    </p>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setServiceDropdownOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 rounded-xl border-2 border-border/60 bg-card px-4 py-3 text-sm font-body text-left hover:border-primary/40 transition-colors focus:outline-none focus:border-primary"
                      >
                        <span className="flex-1 min-w-0">
                          {selectedServices.length === 0 ? (
                            <span className="text-muted-foreground">Selecione os serviços desejados...</span>
                          ) : (
                            <span className="flex flex-wrap gap-1.5">
                              {effectiveSelected.map((s) => (
                                <span key={s.id} className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full border border-primary/25 font-medium">
                                  {s.name}
                                  <button
                                    type="button"
                                    aria-label={`Remover ${s.name}`}
                                    onClick={(e) => { e.stopPropagation(); toggleService(availableServices.find((av) => av.id === s.id)!); }}
                                    className="hover:text-destructive ml-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${serviceDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {serviceDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl">
                          <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                            {availableServices.map((service) => {
                              const eff = getEffectiveService(service);
                              const isSelected = selectedServices.some((s) => s.id === service.id);
                              return (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => { toggleService(service); }}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                                    isSelected && "bg-primary/5"
                                  )}
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {isSelected && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-body text-sm text-foreground font-semibold">{service.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                                        R$ {eff.price.toFixed(2)}
                                      </span>
                                      <span className="text-muted-foreground/40 text-xs">·</span>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3 inline" />{formatDuration(eff.duration)}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedServices.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-primary/8 border border-primary/25 font-body">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs text-muted-foreground flex-1 min-w-0">
                          {effectiveSelected.map((s, i) => (
                            <span key={s.id}>
                              {i > 0 && <span className="text-muted-foreground/40 mx-1">+</span>}
                              <span className="text-foreground/80 font-medium">{s.name}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDuration(totalDuration)}
                          </span>
                          <span className="text-sm font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Date & Time combined */}
              {selectedProfessionalId && selectedServices.length > 0 && (
                <div>
                  <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    Selecione a data
                  </h4>
                  {proAvailability && proAvailability.length === 0 ? (
                    <p className="text-muted-foreground font-body text-sm p-4 bg-secondary rounded-lg">
                      Este profissional ainda não tem disponibilidade cadastrada. Entre em contato com o salão.
                    </p>
                  ) : (
                    <>
                      {/* Selected date display */}
                      {selectedDate && (
                        <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20 font-body text-sm flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          <span className="text-foreground font-medium">
                            {format(selectedDate, "dd 'de' MMMM, yyyy (EEEE)", { locale: ptBR })}
                          </span>
                          <button type="button" onClick={() => { setSelectedDate(undefined); setSelectedTime(""); setShowConfirmation(false); }} className="ml-auto text-muted-foreground hover:text-foreground text-xs">
                            Alterar
                          </button>
                        </div>
                      )}
                      {/* Inline calendar */}
                      {!selectedDate && (
                        <div className="rounded-xl border border-border bg-secondary/50 p-2 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); setShowConfirmation(false); }}
                            disabled={disabledDays || ((d) => d < new Date(new Date().setHours(0, 0, 0, 0)))}
                            locale={ptBR}
                            className="pointer-events-auto"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 4: Time Slots - shown inline right after date */}
                  {selectedDate && (
                    <div className="mt-6">
                      <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">4</span>
                        Escolha seu horário
                        <span className="text-xs font-normal text-muted-foreground ml-auto">{formatDuration(totalDuration)} necessários</span>
                      </h4>
                      {slotsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground font-body text-sm p-4 bg-secondary rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin" />Carregando horários...
                        </div>
                      ) : slots && slots.length > 0 ? (
                        (() => {
                          const morning = slots.filter(s => parseInt(s) < 12);
                          const afternoon = slots.filter(s => parseInt(s) >= 12 && parseInt(s) < 18);
                          const evening = slots.filter(s => parseInt(s) >= 18);

                          return (
                            <Select
                              value={selectedTime}
                              onValueChange={(val) => { setSelectedTime(val); setShowConfirmation(false); }}
                            >
                              <SelectTrigger className="w-full h-12 bg-secondary border-border font-body text-sm">
                                <SelectValue placeholder={`Horários disponíveis de ${selectedProfessional?.name || "profissional"}`} />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {morning.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="font-display text-xs text-primary tracking-wider">☀️ MANHÃ</SelectLabel>
                                    {morning.map((slot) => (
                                      <SelectItem key={slot} value={slot} className="font-body">{slot}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                                {afternoon.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="font-display text-xs text-primary tracking-wider">🌤️ TARDE</SelectLabel>
                                    {afternoon.map((slot) => (
                                      <SelectItem key={slot} value={slot} className="font-body">{slot}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                                {evening.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="font-display text-xs text-primary tracking-wider">🌙 NOITE</SelectLabel>
                                    {evening.map((slot) => (
                                      <SelectItem key={slot} value={slot} className="font-body">{slot}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                              </SelectContent>
                            </Select>
                          );
                        })()
                      ) : (
                        <p className="text-muted-foreground font-body text-sm p-4 bg-secondary rounded-lg">
                          Nenhum horário disponível para esta data. Tente outro dia.
                        </p>
                      )}
                      {selectedTime && (
                        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 font-body text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-foreground">
                            <span className="font-bold text-primary">{selectedTime}</span>
                            {" · "}{formatDuration(totalDuration)}
                            {totalBuffer > 0 && <span className="text-muted-foreground"> + {formatDuration(totalBuffer)} margem</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Customer info + Confirmation */}
              {selectedTime && (
                <div className="space-y-4">
                  <h4 className="font-display text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">5</span>
                    Seus dados
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="customer_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-body">Nome completo</FormLabel>
                        <FormControl><Input placeholder="Seu nome" className="bg-secondary border-border font-body h-12" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customer_phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-body">Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 99999-9999"
                            className="bg-secondary border-border font-body h-12"
                            {...field}
                            onBlur={(e) => { field.onBlur(); void handlePhoneLookup(e.target.value); }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}

              {/* Confirmation Summary */}
              {showConfirmation && (
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 md:p-6 space-y-3 font-body text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <h4 className="font-display text-lg font-bold text-foreground">Confirme seu agendamento</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="text-foreground font-medium">{form.getValues("customer_name")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="text-foreground">{form.getValues("customer_phone")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profissional:</span>
                      <span className="text-foreground font-medium">{selectedProfessional?.name}</span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <span className="text-muted-foreground block mb-1">Serviços:</span>
                      {effectiveSelected.map((s) => (
                        <div key={s.id} className="flex justify-between pl-3">
                          <span className="text-foreground">• {s.name} ({formatDuration(s.duration)})</span>
                          <span className="text-foreground">R$ {s.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="text-foreground font-medium">
                        {selectedDate && format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horário:</span>
                      <span className="text-foreground font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duração total:</span>
                      <span className="text-foreground">{totalDuration} min</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-bold text-foreground">Total:</span>
                      <span className="font-bold text-primary text-lg">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              {selectedTime && (
                <>
                  {!showConfirmation ? (
                    <Button type="button" size="lg" onClick={handleShowConfirmation}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-body text-base py-6 shadow-gold">
                      Revisar Agendamento
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button type="button" size="lg" variant="outline" onClick={() => setShowConfirmation(false)}
                        className="font-body text-base py-6 border-border">
                        Voltar
                      </Button>
                      <Button type="submit" size="lg" disabled={createBooking.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/80 font-body text-base py-6 shadow-gold">
                        {createBooking.isPending && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                        Confirmar
                      </Button>
                    </div>
                  )}
                </>
              )}
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}

