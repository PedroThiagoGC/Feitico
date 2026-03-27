import type { ReactNode } from "react";
import { Bell, CheckCircle, MessageCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useBookingStatusMutation, useAdminNotifications, useAdminNotificationsRealtime, useReminderSentMutation } from "@/hooks/useNotifications";
import { getErrorMessage } from "@/hooks/useQueryError";
import { useSalon } from "@/hooks/useSalon";
import { buildReminderMessage } from "@/services/notificationService";
import type { BookingRecord } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ServiceSnapshot = { duration: number; name: string };

export default function AdminAvisos() {
  const { data: salon, error: salonError, isLoading: isSalonLoading } = useSalon();
  const { data, error, isLoading } = useAdminNotifications(salon?.id);
  const updateStatusMutation = useBookingStatusMutation();
  const reminderSentMutation = useReminderSentMutation();

  useAdminNotificationsRealtime(salon?.id);

  const errorMessage = getErrorMessage(salonError ?? error);
  const pending = data?.pending ?? [];
  const todayList = data?.todayConfirmed ?? [];
  const overdue = data?.overdueConfirmed ?? [];
  const total = pending.length + overdue.length;

  async function handleUpdateStatus(bookingId: string, status: "pending" | "confirmed" | "completed" | "cancelled") {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status });
      toast.success("Status atualizado!");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleSendReminder(booking: BookingRecord) {
    const phone = (booking.customer_phone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("Telefone nao disponivel");
      return;
    }

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(buildReminderMessage(booking))}`, "_blank");

    try {
      await reminderSentMutation.mutateAsync({ bookingId: booking.id });
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Central de Avisos
            {total > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {isSalonLoading || (!salon && !errorMessage) ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground font-body text-sm">Carregando avisos...</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground font-body text-sm">Carregando avisos...</p>
          </CardContent>
        </Card>
      ) : errorMessage ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-destructive font-body text-sm">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Section
            title="Aguardando confirmacao"
            items={pending}
            emptyText="Nenhum agendamento pendente."
            color="text-yellow-400"
            renderActions={(booking) => (
              <>
                <Button
                  size="sm"
                  onClick={() => void handleUpdateStatus(booking.id, "confirmed")}
                  className="bg-green-600 text-white font-body text-xs h-7"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" /> Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void handleUpdateStatus(booking.id, "cancelled")}
                  className="font-body text-xs h-7"
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="w-3 h-3 mr-1" /> Cancelar
                </Button>
              </>
            )}
          />

          <Section
            title={`Hoje - confirmados (${todayList.length})`}
            items={todayList}
            emptyText="Nenhum agendamento confirmado para hoje."
            color="text-green-400"
            renderActions={(booking) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleSendReminder(booking)}
                title={
                  booking.reminder_sent_at
                    ? `Enviado em ${new Date(booking.reminder_sent_at).toLocaleString("pt-BR")}`
                    : "Enviar lembrete"
                }
                className={`font-body text-xs h-7 ${
                  booking.reminder_sent_at ? "border-green-500 text-green-400" : "border-border"
                }`}
                disabled={reminderSentMutation.isPending}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {booking.reminder_sent_at ? "Enviado" : "Lembrar"}
              </Button>
            )}
          />

          <Section
            title="Em atraso - precisam de acao"
            items={overdue}
            emptyText="Nenhum agendamento em atraso."
            color="text-destructive"
            renderActions={(booking) => (
              <>
                <Button
                  size="sm"
                  onClick={() => void handleUpdateStatus(booking.id, "completed")}
                  className="bg-blue-600 text-white font-body text-xs h-7"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" /> Concluir
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void handleUpdateStatus(booking.id, "cancelled")}
                  className="font-body text-xs h-7"
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="w-3 h-3 mr-1" /> Cancelar
                </Button>
              </>
            )}
          />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  emptyText,
  color,
  renderActions,
}: {
  title: string;
  items: BookingRecord[];
  emptyText: string;
  color: string;
  renderActions: (booking: BookingRecord) => ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className={`font-display text-base ${color}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {items.map((booking) => {
              const servicesSnapshot = Array.isArray(booking.services)
                ? (booking.services as ServiceSnapshot[])
                : [];

              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary border border-border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body font-semibold text-foreground text-sm">
                        {booking.customer_name}
                      </span>
                      <span className="font-body text-xs text-muted-foreground">
                        {booking.customer_phone}
                      </span>
                      {booking.booking_time && (
                        <span className="font-mono text-xs text-primary font-bold">
                          {booking.booking_date} {booking.booking_time}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {servicesSnapshot.map((service) => service.name).join(", ")} - R${" "}
                      {Number(booking.total_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {renderActions(booking)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
