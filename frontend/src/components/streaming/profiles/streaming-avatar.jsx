"use client";

import { useState } from "react";
import { avatarSource, DEFAULT_AVATAR, officialAvatar } from "./profile-data";

export default function StreamingAvatar({ avatar, alt = "", className }) {
  const [failedAvatar, setFailedAvatar] = useState(null);
  const officialId = officialAvatar(avatar);
  const displayedId = failedAvatar === officialId ? DEFAULT_AVATAR : officialId;
  return <img src={avatarSource(displayedId)} alt={alt} className={className} width={256} height={256}
    onError={displayedId === DEFAULT_AVATAR ? undefined : () => setFailedAvatar(officialId)} />;
}
