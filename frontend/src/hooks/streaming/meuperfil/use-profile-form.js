"use client";

import { useState, useRef } from "react";

export default function useProfileForm(profile, onSave) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
    if (file.size > 2 * 1024 * 1024) return setError("A imagem precisa ter até 2 MB.");
    const reader = new FileReader();
    reader.onload = () => { setError(""); setAvatar({ type: "image", src: reader.result }); };
    reader.readAsDataURL(file);
  };

  const cleanName = name.trim();

  const choosePhoto = () => fileRef.current?.click();
  const removePhoto = () => setAvatar({ type: "preset", id: "film" });
  const changeName = (e) => setName(e.target.value);
  const submit = () => onSave({ name: cleanName, avatar });
  const chooseAvatar = (id) => setAvatar({ type: "preset", id });
  return { name, avatar, error, fileRef, onFile, cleanName, choosePhoto, removePhoto, chooseAvatar, changeName, submit };
}
