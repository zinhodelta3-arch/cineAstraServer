"use client";

import { useState } from "react";

export default function useProfilePoster() {
  const [failed, setFailed] = useState(false);
  const handleError = () => setFailed(true);
  return { failed, handleError };
}
