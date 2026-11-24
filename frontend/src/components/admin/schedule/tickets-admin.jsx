"use client";

import { scheduleRequest } from "@/hooks/admin/use-admin-schedule";
import SessionContext from "@/components/session-context/session-context";
import { SessionRecords, SessionTickets } from "@/components/session-context/session-records";
import ScheduleLayout from "./schedule-layout";
import SessionPicker, { useSessionSelection } from "./session-picker";

export default function TicketsAdmin() {
  const selection = useSessionSelection();
  const session = selection.session;
  return <ScheduleLayout title="Ingressos" description="Consulte participantes, pedidos e registros desta sessão." sessionSelected={Boolean(session || selection.loading)}>
    <SessionContext selection={selection} area="admin" active="tickets" />
    <SessionPicker selection={selection} />
    {session && <>
      <SessionTickets key={session.id_sessao} sessionId={session.id_sessao} request={scheduleRequest} />
      <SessionRecords key={`records-${session.id_sessao}`} sessionId={session.id_sessao} request={scheduleRequest} admin />
    </>}
  </ScheduleLayout>;
}
