import { useState } from 'react'

export default function ImageFallback({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={className} role="img" aria-label={alt}>
        <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#E0F4FF" />
              <stop offset="100%" stopColor="#EFF6FF" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g1)" />
          <g transform="translate(40,40)">
            <circle cx="80" cy="60" r="36" fill="#CFF4FF" />
            <rect x="150" y="30" rx="12" ry="12" width="320" height="220" fill="#FFFFFF" opacity="0.6" />
            <text x="190" y="130" fill="#0F172A" fontSize="20" fontWeight="700">Imagem indisponível</text>
          </g>
        </svg>
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}
