"use client";

import { useState } from "react";
import { BENEFITS } from "@/components/cinema/parcerias/data";

export default function useCinemaPartnerships() {
  const [category, setCategory] = useState('Todos');
  const benefits = category === 'Todos' ? BENEFITS : BENEFITS.filter((benefit) => benefit.category === category);
  const showAllBenefits = () => setCategory('Todos');

  return { category, setCategory, benefits, showAllBenefits };
}
