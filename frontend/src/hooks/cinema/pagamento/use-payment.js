"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

const EMPTY_DETAILS = { name: "", phone: "", email: "", address: "", country: "BR", city: "", postalCode: "" };
const DEMO_CARD = { id: "demo-visa", brand: "Visa", last4: "4829", expiry: "08/29", nickname: "Cartão de exemplo" };

export default function usePayment() {
  const { items, itemCount, total } = useCart();
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [cards, setCards] = useState([DEMO_CARD]);
  const [selectedCard, setSelectedCard] = useState(DEMO_CARD.id);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardError, setCardError] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const changeDetail = (event) => {
    const { name, value } = event.target;
    setDetails((previous) => ({ ...previous, [name]: value }));
    setError("");
  };
  const changeCardOpen = (open) => { setCardError(""); setCardOpen(open); };
  function addCard(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const last4 = String(data.get("last4")).trim();
    const expiry = String(data.get("expiry")).trim();
    const [month, year] = expiry.split("/").map(Number);
    if (!/^\d{4}$/.test(last4) || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) || new Date(2000 + year, month, 1) <= new Date()) {
      setCardError("Informe quatro dígitos e uma validade futura no formato MM/AA.");
      return;
    }
    const card = { id: crypto.randomUUID(), brand: String(data.get("brand")), last4, expiry, nickname: String(data.get("nickname")).trim() || "Cartão de exemplo" };
    setCards((previous) => [...previous, card]);
    setSelectedCard(card.id);
    setCardOpen(false);
  }
  function confirm(event) {
    event.preventDefault();
    if (!items.length) { setError("Adicione itens ao carrinho para continuar."); return; }
    if (Object.values(details).some((value) => !value.trim())) { setError("Preencha todos os dados de pagamento."); return; }
    if (details.phone.replace(/\D/g, "").length < 8) { setError("Confira o telefone e inclua o código de área."); return; }
    if (details.country === "BR" && !/^\d{8}$/.test(details.postalCode.replace(/\D/g, ""))) { setError("Informe um CEP com 8 dígitos."); return; }
    if (!cards.some((card) => card.id === selectedCard)) { setError("Selecione um cartão para continuar."); return; }
    setError("");
    setConfirmed(true);
  }
  return { items, itemCount, total, details, changeDetail, cards, selectedCard, setSelectedCard, cardOpen, changeCardOpen, cardError, addCard, error, confirmed, setConfirmed, confirm };
}
