import { useState } from "react";

function fallbackAvatar(user) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome || "Viajante")}&background=DBEAFE&color=1D4ED8&size=256`;
}

export default function UserAvatar({ user, alt = "", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = user?.fotoUrl;
  const displayedSrc = src && failedSrc !== src ? src : fallbackAvatar(user);

  return (
    <img
      src={displayedSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (src && failedSrc !== src) setFailedSrc(src);
      }}
    />
  );
}
