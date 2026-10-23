"use client";

import { useState } from "react";
import { periods } from "@/components/admin/dashboard/data";

export function useDashboard() {
  const [period, setPeriod] = useState("week");
  return { period, setPeriod, data: periods[period] };
}
