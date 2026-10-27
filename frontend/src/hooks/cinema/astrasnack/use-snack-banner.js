"use client";

import { useEffect, useState } from "react";
import { BANNERS } from "@/components/cinema/astrasnack/data";

export function useSnackBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((value) => (value + 1) % BANNERS.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [])

  const banner = BANNERS[current]

  const previous = () => setCurrent((value) => (value - 1 + BANNERS.length) % BANNERS.length);
  const next = () => setCurrent((value) => (value + 1) % BANNERS.length);
  return { current, setCurrent, banner, previous, next };
}
