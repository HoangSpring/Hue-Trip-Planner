import { useState } from 'react'

export function PlacePhoto({ src, alt, loading = 'lazy', className = '' }: { src: string | null; alt: string; loading?: 'eager' | 'lazy'; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div role="img" aria-label={alt} className={`grid place-items-center overflow-hidden bg-[#eee7d9] ${className}`}>
    <svg viewBox="0 0 480 270" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="480" height="270" fill="#f1eadc"/><circle cx="390" cy="54" r="34" fill="#d5bc8d"/>
      <path d="M0 192c72-32 132-14 210 2s151-15 270-41v117H0z" fill="#9ab4a8"/>
      <path d="M0 222c93-24 169 16 268-3s144-26 212-15v66H0z" fill="#6f9994"/>
      <path d="M125 202V111c0-39 28-67 62-67s62 28 62 67v91" fill="#ead9b8" stroke="#a57f4d" strokeWidth="10"/>
      <path d="M159 201v-88c0-20 12-34 28-34s28 14 28 34v88" fill="#8a6b4d"/>
      <path d="M92 201h191" stroke="#a57f4d" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  </div>
  return <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} className={`h-full w-full object-cover ${className}`} />
}
