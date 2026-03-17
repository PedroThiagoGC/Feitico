import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useAvailableSlots, useCreateBooking, generateWhatsAppMessage } from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const createBooking = useCreateBooking();

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    salon?.id,
    dateStr,
    totalDuration
  );

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      booking_type: "scheduled",
    },
  });

  const bookingType = form.watch("booking_type");

  const toggleService = useCallback((service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, service];
    });
    setSelectedTime("");
  }, []);

  const onSubmit = async (data: BookingFormData) => {
    if (selectedServices.length === 0) {
      toast.error("Selecione pelo menos um serviço");
      return;
    }
    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }
    if (data.booking_type === "scheduled" && !selectedTime) {
      toast.error("Selecione um horário");
      return;
    }

    const bookingData = {
      salon_id: salon!.id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      services: selectedServices.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        duration: s.duration,
      })),
      total_price: totalPrice,
      total_duration: totalDuration,
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: data.booking_type === "scheduled" ? selectedTime : null,
      booking_type: data.booking_type,
    };

    try {
      await createBooking.mutateAsync(bookingData);
      toast.success("Agendamento realizado com sucesso!");

      // Open WhatsApp
      if (salon?.whatsapp) {
        const whatsappUrl = generateWhatsAppMessage(bookingData, salon.whatsapp);
        window.open(whatsappUrl, "_blank");
      }

      form.reset();
      setSelectedServices([]);
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch {
      toast.error("Erro ao realizar agendamento. Tente novamente.");
    }
  };

  return (
    <section id="booking" className="py-24 bg-background">
      <div className="container px-4 max-w-3xl">
        <div
          ref={ref}
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Faça seu <span className="text-gradient-gold">Agendamento</span>
          </h2>
          <p className="font-body text-muted-foreground">
            Escolha seus serviços, data e horário
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-gold">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Nome completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome"
                          className="bg-secondary border-border font-body"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-body">Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          className="bg-secondary border-border font-body"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Services */}
              <div>
                <h4 className="font-display text-lg font-semibold mb-4 text-foreground">
                  Selecione os serviços
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services?.map((service) => {
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
                        <Checkbox checked={isSelected} className="pointer-events-none" />
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
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 font-body text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="text-foreground">{totalDuration} min</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Type */}
              <FormField
                control={form.control}
                name="booking_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-body">Tipo de agendamento</FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("scheduled")}
                        className={`p-3 rounded-lg border text-center font-body text-sm transition-all ${
                          field.value === "scheduled"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        <Clock className="w-4 h-4 mx-auto mb-1" />
                        Horário marcado
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("walk_in")}
                        className={`p-3 rounded-lg border text-center font-body text-sm transition-all ${
                          field.value === "walk_in"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="w-4 h-4 mx-auto mb-1" />
                        Ordem de chegada
                      </button>
                    </div>
                  </FormItem>
                )}
              />

              {/* Date */}
              <div>
                <label className="font-body text-sm font-medium mb-2 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-body bg-secondary border-border"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        setSelectedDate(d);
                        setSelectedTime("");
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots */}
              {bookingType === "scheduled" && selectedDate && selectedServices.length > 0 && (
                <div>
                  <label className="font-body text-sm font-medium mb-3 block">
                    Horário disponível
                  </label>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando horários...
                    </div>
                  ) : slots && slots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 rounded-lg border text-center font-body text-sm transition-all ${
                            selectedTime === slot
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary text-foreground hover:border-primary/30"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground font-body text-sm">
                      Nenhum horário disponível para esta data.
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={createBooking.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-body text-base py-6 shadow-gold"
              >
                {createBooking.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Confirmar Agendamento
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
