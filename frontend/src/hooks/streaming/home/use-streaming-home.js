"use client";
import { useState } from "react";
import { RELEASED } from "@/components/streaming/home/data";

export default function useStreamingHome() {
  const [genre, setGenre] = useState("Todos");
  const [playing, setPlaying] = useState(null);
  const [details, setDetails] = useState(null);
  const [myList, setMyList] = useState([]);
  const [isListOpen, setIsListOpen] = useState(false);

  const isInList = (id) => myList.some((i) => i.id === id);
  const toggleList = (item) => setMyList((prev) => (prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]));

  const filtered = genre === "Todos" ? RELEASED : RELEASED.filter((m) => m.genre === genre);

  const closePlayer = () => setPlaying(null);
  const closeDetails = () => setDetails(null);
  const openList = () => setIsListOpen(true);
  const closeList = () => setIsListOpen(false);
  return { genre, setGenre, playing, setPlaying, details, setDetails, myList, isListOpen, isInList, toggleList, filtered, closePlayer, closeDetails, openList, closeList };
}
