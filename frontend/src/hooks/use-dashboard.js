"use client";

import { useEffect, useState } from "react";

export function useDashboard() {
  const [period, setPeriod] = useState("week");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${period}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/dashboard/report?period=${period}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "Não foi possível carregar o dashboard.");
        return body;
      })
      .then((report) => { if (!controller.signal.aborted) setResult({ key, report, error: null }); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ key, report: null, error: error.message }); });
    return () => controller.abort();
  }, [key, period]);

  const current = result?.key === key ? result : { report: null, error: null };
  return { period, setPeriod, ...current, loading: result?.key !== key, retry: () => setRevision((value) => value + 1) };
}
