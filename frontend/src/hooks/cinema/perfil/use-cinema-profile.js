"use client";

import { useEffect, useRef, useState } from "react";
import { INITIAL_PROFILE, MOVIES, INITIAL_CARDS } from "@/components/cinema/perfil/data";

export default function useCinemaProfile() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [favorites, setFavorites] = useState(MOVIES);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [removedFavorite, setRemovedFavorite] = useState(null);
  const [signedOut, setSignedOut] = useState(false);
  const noticeTimer = useRef(null);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  function notify(message) { clearTimeout(noticeTimer.current); setNotice(message); noticeTimer.current = setTimeout(() => setNotice(""), 6000); }
  function removeFavorite(id) { const movie = favorites.find((item) => item.id === id); setRemovedFavorite(movie); setFavorites((previous) => previous.filter((item) => item.id !== id)); notify("Filme removido dos favoritos."); }
  function setDefault(id) { setCards((previous) => previous.map((card) => ({ ...card, isDefault: card.id === id }))); notify("Cartão padrão atualizado."); }
  function removeCard(id) { setCards((previous) => { const remaining = previous.filter((card) => card.id !== id); if (remaining.length && !remaining.some((card) => card.isDefault)) remaining[0] = { ...remaining[0], isDefault: true }; return remaining; }); notify("Cartão removido."); }
  const returnToDemo = () => setSignedOut(false);
  const restoreFavorite = () => { setFavorites((previous) => [...previous, removedFavorite]); setRemovedFavorite(null); notify("Filme restaurado aos favoritos."); };
  const closePurchase = () => setSelectedPurchase(null);
  const signOut = () => { setSignedOut(true); setNotice(""); };
  const saveProfile = (updated) => { setProfile(updated); notify("Perfil atualizado."); };
  const toggleCards = () => setCardsExpanded((previous) => !previous);
  const expandCards = () => setCardsExpanded(true);
  const addCard = (card) => { setCards((previous) => [...previous, { ...card, isDefault: previous.length === 0 }]); notify("Cartão de exemplo adicionado."); };

  return { profile, favorites, cards, cardsExpanded, selectedPurchase, setSelectedPurchase, historyOpen, setHistoryOpen, notice, removedFavorite, signedOut, notify, removeFavorite, setDefault, removeCard, returnToDemo, restoreFavorite, closePurchase, signOut, saveProfile, toggleCards, expandCards, addCard };
}
