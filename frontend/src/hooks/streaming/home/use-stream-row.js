"use client";
import { useRef } from "react";

export default function useStreamRow() {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });

  return { ref, scroll };
}
