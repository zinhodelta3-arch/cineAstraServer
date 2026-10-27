"use client";

import { useState } from "react";
import { FEATURES } from "@/components/cinema/home/data";

export function useHomeExperience() {
  const [tab, setTab] = useState("imax");
  return { tab, setTab, item: FEATURES[tab] };
}
