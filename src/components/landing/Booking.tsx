import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useAvailableSlots, useCreateBooking, generateWhatsAppMessage, calculateCommission } from "@/hooks/useBooking";
import { useProfessionals, useProfessionalServices, useProfessionalAvailability } from "@/hooks/useProfessionals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock, Loader2, User, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Service } from "@/hooks/useServices";
import type { Salon } from "@/hooks/useSalon";

const bookingSchema = z.object({
  customer_name: z.string().trim().min(2, "Nome é obrigatório").max(100),
  customer_phone: z.string().trim().min(10, "Telefone inválido").max(20),
  booking_type: z.enum(["scheduled", "walk_in"]),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingProps {
  salon: Salon | undefined;
  services: Service[] | undefined;
  preselectedServices?: Service[];
}

export default function Booking({ salon, services, preselectedServices }: BookingProps) {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedServices, setSelectedServices] = useState<Service[]>(preselectedServices || []);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const createBooking = useCreateBooking();

  const { data: professionals } = useProfessionals(salon?.id);
  const { data: proServices } = useProfessionalServices(selectedProfessionalId || undefined);
  const { data: proAvailability } = useProfessionalAvailability(selectedProfessionalId || undefined);

  const disabledDays = useMemo(() => {
    if (!proAvailability || proAvailability.length === 0) return undefined;
    const activeWeekdays = new Set(proAvailability.map((a) => a.weekday));
    return (date: Date) => {
      if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
      return !activeWeekdays.has(date.getDay());
    };
  }, [proAvailability]);

  const availableServices = useMemo(() => {
    if (!services) return [];
    if (!selectedProfessionalId || !proServices) return services;
    const linkedIds = new Set(proServices.map((ps) => ps.service_id));
    return services.filter((s) => linkedIds.has(s.id));
  }, [services, selectedProfessionalId, proServices]);

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
    defaultValues: { customer_name: "", customer_phone: "", booking_type: "scheduled" },
  });

  const bookingType = form.watch("booking_type");
  const selectedProfessional = professionals?.find((p) => p.id === selectedProfessionalId);

  const toggleService = useCallback((service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
    setSelectedTime("");
  }, []);

  function getCommissionInfo() {
    if (!selectedProfessionalId || !professionals) return { type: "percentage", value: 0 };
    const pro = professionals.find((p) => p.id === selectedProfessionalId);
    return { type: pro?.commission_type || "percentage", value: Number(pro?.commission_value || 0) };
  }

  // Check if form is ready for confirmation
  const isReadyToConfirm = useMemo(() => {
    const values = form.getValues();
    if (!values.customer_name || values.customer_name.trim().length < 2) return false;
    if (!values.customer_phone || values.customer_phone.trim().length < 10) return false;
    if (selectedServices.length === 0) return false;
    if (!selectedProfessionalId) return false;
    if (!selectedDate) return false;
    if (bookingType === "scheduled" && !selectedTime) return false;
    return true;
  }, [form.watch("customer_name"), form.watch("customer_phone"), selectedServices, selectedProfessionalId, selectedDate, selectedTime, bookingType]);

  const handleShowConfirmation = () => {
    if (!isReadyToConfirm) {
      if (selectedServices.length === 0) toast.error("Selecione pelo menos um serviço");
      else if (!selectedProfessionalId) toast.error("Selecione um profissional");
      else if (!selectedDate) toast.error("Selecione uma data");
      else if (bookingType === "scheduled" && !selectedTime) toast.error("Selecione um horário");
      else form.handleSubmit(() => {})(); // trigger validation
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
      booking_time: data.booking_type === "scheduled" ? selectedTime : null,
      booking_type: data.booking_type as "scheduled" | "walk_in",
    };

    try {
      await createBooking.mutateAsync(bookingData);
      toast.success("Agendamento realizado com sucesso!");

      const whatsappUrl = generateWhatsAppMessage({
        booking: bookingData,
        salonName: salon?.name || "Salão",
        salonAddress: salon?.address || "",
        professionalName: selectedProfessional?.name || "",
      });
      window.open(whatsappUrl, "_blank");

      form.reset();
      setSelectedServices([]);
      setSelectedDate(undefined);
      setSelectedTime("");
      setShowConfirmation(false);
    } catch {
      toast.error("Erro ao realizar agendamento. Tente novamente.");
    }
  };

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
          <p className="font-body text-muted-foreground text-sm md:text-base">Escolha profissional, serviços, data e horário</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-gold">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
              {/* Name & Phone */}
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
                    <FormControl><Input placeholder="(11) 99999-9999" className="bg-secondary border-border font-body h-12" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Professional selection */}
              <div>
                <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground">Selecione o profissional</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {professionals?.map((pro) => (
                    <button
                      type="button"
                      key={pro.id}
                      onClick={() => {
                        setSelectedProfessionalId(pro.id);
                        setSelectedServices([]);
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

              {/* Services */}
              {selectedProfessionalId && (
                <div>
                  <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground">Selecione os serviços</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableServices.map((service) => {
                      const eff = getEffectiveService(service);
                      const isSelected = selectedServices.some((s) => s.id === service.id);
                      return (
                        <button
                          type="button"
                          key={service.id}
                          onClick={() => { toggleService(service); setShowConfirmation(false); }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left font-body text-sm ${
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-secondary hover:border-primary/30 text-muted-foreground"
                          }`}
                        >
                          <Checkbox checked={isSelected} className="pointer-events-none shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="block font-medium truncate">{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              R$ {eff.price.toFixed(2)} · {eff.duration}min
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Booking Type */}
              <FormField control={form.control} name="booking_type" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body">Tipo de agendamento</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => { field.onChange("scheduled"); setShowConfirmation(false); }}
                      className={`p-3 rounded-lg border text-center font-body text-sm transition-all ${field.value === "scheduled" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-muted-foreground"}`}>
                      <Clock className="w-4 h-4 mx-auto mb-1" />Horário marcado
                    </button>
                    <button type="button" onClick={() => { field.onChange("walk_in"); setShowConfirmation(false); }}
                      className={`p-3 rounded-lg border text-center font-body text-sm transition-all ${field.value === "walk_in" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-muted-foreground"}`}>
                      <CalendarIcon className="w-4 h-4 mx-auto mb-1" />Ordem de chegada
                    </button>
                  </div>
                </FormItem>
              )} />

              {/* Date */}
              <div>
                <label className="font-body text-sm font-medium mb-2 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-body bg-secondary border-border h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); setShowConfirmation(false); }} disabled={disabledDays || ((d) => d < new Date(new Date().setHours(0, 0, 0, 0)))} locale={ptBR} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots */}
              {bookingType === "scheduled" && selectedDate && selectedServices.length > 0 && selectedProfessionalId && (
                <div>
                  <label className="font-body text-sm font-medium mb-3 block">Horário disponível</label>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />Carregando horários...
                    </div>
                  ) : slots && slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <button type="button" key={slot} onClick={() => { setSelectedTime(slot); setShowConfirmation(false); }}
                          className={`p-2.5 rounded-lg border text-center font-body text-sm transition-all ${selectedTime === slot ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-foreground hover:border-primary/30"}`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground font-body text-sm">Nenhum horário disponível para esta data.</p>
                  )}
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
                          <span className="text-foreground">• {s.name} ({s.duration}min)</span>
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
                      <span className="text-foreground font-medium">
                        {bookingType === "scheduled" ? selectedTime : "Ordem de chegada"}
                      </span>
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
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
