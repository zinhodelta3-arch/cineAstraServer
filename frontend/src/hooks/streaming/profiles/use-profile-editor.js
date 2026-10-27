"use client";

import { useEffect, useRef, useState } from "react";
import { AVATARS, readProfilePhoto, validateName } from "@/components/streaming/profiles/profile-data";

export default function useProfileEditor(profile, profiles, onSave) {
  const [draft, setDraft] = useState(profile || { name: "", avatar: AVATARS[profiles.length % AVATARS.length].id, photo: "", kids: false });
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const update = (field, value) => { setDraft((p) => ({ ...p, [field]: value })); setError(""); };
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true); setError("");
    try {
      const photo = await readProfilePhoto(file);
      if (alive.current) setDraft((p) => ({ ...p, photo }));
    } catch (err) { if (alive.current) setError(err.message); }
    finally { if (alive.current) setPhotoBusy(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    const invalid = validateName(draft.name, profiles, profile?.id);
    if (invalid) return setError(invalid);
    const saveError = onSave({ ...draft, name: draft.name.trim() });
    if (saveError) setError(saveError);
  };
  const openPhotoPicker = () => fileRef.current?.click();
  const chooseAvatar = (id) => { setDraft((p) => ({ ...p, avatar: id, photo: "" })); setError(""); };
  return { draft, error, photoBusy, fileRef, update, choosePhoto, submit, chooseAvatar, openPhotoPicker };
}
