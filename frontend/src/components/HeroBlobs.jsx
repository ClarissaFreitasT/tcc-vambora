import { motion } from 'framer-motion'

export default function HeroBlobs({ className = '' }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 800 600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hb1" x1="0" x2="1">
          <stop offset="0%" stopColor="#E0F4FF" />
          <stop offset="100%" stopColor="#DFF6FF" />
        </linearGradient>
      </defs>
      <motion.ellipse cx="120" cy="120" rx="160" ry="90" fill="url(#hb1)" opacity="0.9" animate={{ translateX: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.ellipse cx="600" cy="80" rx="220" ry="120" fill="#F0FAFF" opacity="0.7" animate={{ translateY: [0, -6, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.ellipse cx="480" cy="260" rx="120" ry="70" fill="#E8FBFF" opacity="0.85" animate={{ translateX: [0, -6, 0] }} transition={{ duration: 7, repeat: Infinity }} />
    </motion.svg>
  )
}
