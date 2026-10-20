import { useState } from "react";

export default function ImageFallback({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={className} role="img" aria-label={alt}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 600 400"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vambora-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#83d7ee" />
              <stop offset="100%" stopColor="#f3d9ad" />
            </linearGradient>
            <linearGradient id="vambora-water" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#1385a6" />
              <stop offset="100%" stopColor="#0e496c" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#vambora-sky)" />
          <circle cx="452" cy="95" r="43" fill="#ffe6a4" opacity=".95" />
          <path
            d="M0 238 122 112l93 105 94-132 157 163v152H0z"
            fill="#4c8290"
          />
          <path
            d="m64 203 58-91 67 76-40-13-25 21-24-10zM240 189l69-104 79 109-48-24-32 19-28-17z"
            fill="#e7f3ed"
            opacity=".92"
          />
          <path
            d="M0 279c105-39 161 14 261-5s203-29 339 12v114H0z"
            fill="url(#vambora-water)"
          />
          <path
            d="M0 300c105-28 172 15 271-2s201-27 329 5M0 341c117-17 197 12 301-3s187-18 299 2"
            fill="none"
            stroke="#a9e6e5"
            strokeOpacity=".65"
            strokeWidth="5"
          />
          <text
            x="28"
            y="366"
            fill="#fff"
            fillOpacity=".85"
            fontSize="14"
            fontWeight="700"
            letterSpacing="3"
          >
            VAMBORA · SUA PRÓXIMA VIAGEM
          </text>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
