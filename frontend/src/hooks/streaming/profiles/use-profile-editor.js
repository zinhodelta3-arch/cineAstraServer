"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_AVATAR, officialAvatar, validateName } from "@/components/streaming/profiles/profile-data";

export default function useProfileEditor(profile, profiles, onSave) {
  const [draft, setDraft] = useState(() => profile
    ? { ...profile, avatar:officialAvatar(profile.avatar) }
    : { name:"", avatar:DEFAULT_AVATAR, kids:false });
  const [error, setError] = useState(profile?.saveError || "");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const update = (field, value) => { setDraft(current => ({ ...current, [field]:value })); setError(""); };

  const submit = async event => {
    event.preventDefault();
    if (busy.current) return;
    const invalid = validateName(draft.name, profiles, profile?.id);
    if (invalid) return setError(invalid);
    busy.current = true;
    setSaving(true);
    try {
      const saveError = await onSave({ ...draft, name:draft.name.trim() });
      if (saveError && alive.current) setError(saveError);
    } finally {
      busy.current = false;
      if (alive.current) setSaving(false);
    }
  };
  return { draft, error, saving, update, submit };
}
