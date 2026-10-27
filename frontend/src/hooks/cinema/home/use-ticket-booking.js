"use client";

import { useState } from "react";
import { useEscapeClose } from "./use-escape-close";
import { formatBRL } from "@/components/cinema/home/data";

export function useTicketBooking(movie, onClose, onAddToCart) {
  const sessions = movie.sessions?.length ? movie.sessions : ["18:00", "20:30"];
  const [date, setDate] = useState("Hoje");
  const [session, setSession] = useState(sessions[0]);
  const [count, setCount] = useState(2);
  const [type, setType] = useState("inteira");

  useEscapeClose(onClose);

  const unit = type === "inteira" ? 38 : 19;
  const totalValue = unit * count;

  const confirm = () => {
    onAddToCart({
      id: `ticket-${movie.id}-${Date.now()}`,
      title: `Ingresso: ${movie.title}`,
      description: `${date} às ${session} (${count}x ${type})`,
      price: totalValue,
      priceFormatted: formatBRL(totalValue),
    });
    onClose();
  };

  return { sessions, date, setDate, session, setSession, count, setCount, type, setType, totalValue, confirm };
}
