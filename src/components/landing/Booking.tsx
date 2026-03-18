import { useState, useCallback, useMemo, useEffect } from "react";
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
import { CalendarIcon, Clock, Loader2, User, Check, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Service } from "@/hooks/useServices";
import type { Salon } from "@/hooks/useSalon";

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
  const createBooking = useCreateBooking();

  const { data: professionals } = useProfessionals(salon?.id);
  const { data: proServices } = useProfessionalServices(selectedProfessionalId || undefined);
  const { data: proAvailability } = useProfessionalAvailability(selectedProfessionalId || undefined);

  // When preselectedServices changes (user clicked "Agendar" on a service card), set it
  useEffect(() => {
    if (preselectedServices && preselectedServices.length > 0) {
      setSelectedServices(preselectedServices);
      // Reset downstream selections
      setSelectedProfessionalId("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setShowConfirmation(false);
    }
  }, [preselectedServices]);

  // Filter professionals to only those who offer ALL selected services
  const availableProfessionals = useMemo(() => {
    if (!professionals || selectedServices.length === 0) return professionals || [];
    // We need to check each professional's linked services
    // Since we can't query all at once client-side without individual hooks,
    // we show all professionals and filter services after selection.
    // But we can still show all and let the service validation happen after.
    return professionals;
  }, [professionals, selectedServices]);

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
    if (!selectedProfessionalId || !proServices) return services;
    const linkedIds = new Set(proServices.map((ps) => ps.service_id));
    return services.filter((s) => linkedIds.has(s.id));
  }, [services, selectedProfessionalId, proServices]);

  const incompatibleSelectedServices = useMemo(() => {
    if (!selectedProfessionalId || !proServices || selectedServices.length === 0) return [];
    const linkedIds = new Set(proServices.map((ps) => ps.service_id));
    return selectedServices.filter((s) => !linkedIds.has(s.id));
  }, [selectedProfessionalId, proServices, selectedServices]);

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

  const customerName = form.watch("customer_name");
  const customerPhone = form.watch("customer_phone");

  const isReadyToConfirm = useMemo(() => {
    if (!customerName || customerName.trim().length < 2) return false;
    if (!customerPhone || customerPhone.trim().length < 10) return false;
    if (selectedServices.length === 0) return false;
    if (!selectedProfessionalId) return false;
    if (incompatibleSelectedServices.length > 0) return false;
    if (!selectedDate) return false;
    if (!selectedTime) return false;
    return true;
  }, [customerName, customerPhone, selectedServices, selectedProfessionalId, incompatibleSelectedServices, selectedDate, selectedTime]);

  const handleShowConfirmation = () => {
    if (!isReadyToConfirm) {
      if (selectedServices.length === 0) toast.error("Selecione pelo menos um serviço");
      else if (!selectedProfessionalId) toast.error("Selecione um profissional");
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

      const whatsappUrl = generateWhatsAppMessage({
        booking: bookingData,
        salonName: salon?.name || "Salão",
        salonAddress: salon?.address || "",
        professionalName: selectedProfessional?.name || "",
      });
      window.open(whatsappUrl, "_blank");

      form.reset();
      setSelectedServices([]);
      setSelectedProfessionalId("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setShowConfirmation(false);
    } catch {
      toast.error("Erro ao realizar agendamento. Tente novamente.");
    }
  };

  // Step indicators
  const currentStep = !selectedServices.length ? 1
    : !selectedProfessionalId ? 2
    : !selectedDate ? 3
    : !selectedTime ? 4
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
          <p className="font-body text-muted-foreground text-sm md:text-base">Escolha serviço, profissional, data e horário</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Serviço", "Profissional", "Data", "Horário", "Confirmar"].map((label, i) => (
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
              {/* Step 1: Services */}
              <div>
                <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                  Selecione os serviços
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(services || []).map((service) => {
                    const isSelected = selectedServices.some((s) => s.id === service.id);
                    return (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => toggleService(service)}
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
                            R$ {Number(service.price).toFixed(2)} · {service.duration}min
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 font-body text-sm">
                    <span className="text-muted-foreground">Selecionados: </span>
                    <span className="text-foreground font-medium">{selectedServices.map(s => s.name).join(", ")}</span>
                    <span className="text-muted-foreground"> · Total: </span>
                    <span className="text-primary font-bold">R$ {totalPrice.toFixed(2)}</span>
                    <span className="text-muted-foreground"> · {totalDuration}min</span>
                  </div>
                )}
              </div>

              {/* Step 2: Professional (only show after service selection) */}
              {selectedServices.length > 0 && (
                <div>
                  <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    Selecione o profissional
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableProfessionals.map((pro) => (
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
                  {/* Show which services this professional can do vs not */}
                  {selectedProfessionalId && proServices && (
                    <div className="mt-3 font-body text-xs text-muted-foreground">
                      {selectedServices.filter(s => !availableServices.some(as => as.id === s.id)).length > 0 && (
                        <p className="text-destructive">
                          ⚠ Este profissional não realiza: {selectedServices.filter(s => !availableServices.some(as => as.id === s.id)).map(s => s.name).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Date (only show after professional selection) */}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-body bg-secondary border-border h-12">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy (EEEE)", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); setShowConfirmation(false); }}
                          disabled={disabledDays || ((d) => d < new Date(new Date().setHours(0, 0, 0, 0)))}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

              {/* Step 4: Time Slots */}
              {selectedDate && selectedServices.length > 0 && selectedProfessionalId && (
                <div>
                  <h4 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">4</span>
                    Selecione o horário
                  </h4>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground font-body text-sm p-4 bg-secondary rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />Carregando horários disponíveis...
                    </div>
                  ) : slots && slots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => { setSelectedTime(slot); setShowConfirmation(false); }}
                          className={`p-2.5 rounded-lg border text-center font-body text-sm transition-all ${
                            selectedTime === slot
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary text-foreground hover:border-primary/30"
                          }`}
                        >
                          <Clock className="w-3 h-3 mx-auto mb-0.5" />
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground font-body text-sm p-4 bg-secondary rounded-lg">
                      Nenhum horário disponível para esta data. Tente outro dia.
                    </p>
                  )}
                  {selectedTime && (
                    <p className="mt-2 text-sm font-body text-foreground">
                      Horário selecionado: <span className="font-bold text-primary">{selectedTime}</span>
                      {" · "}{totalDuration}min de serviço
                      {totalBuffer > 0 && <span className="text-muted-foreground"> + {totalBuffer}min margem</span>}
                    </p>
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
                        <FormControl><Input placeholder="(11) 99999-9999" className="bg-secondary border-border font-body h-12" {...field} /></FormControl>
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
