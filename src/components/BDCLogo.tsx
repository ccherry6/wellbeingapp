import React, { useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface BDCLogoProps {
  className?: string
  alt?: string
}

export function BDCLogo({ className = "h-12 w-auto", alt = "Thrive - Peak Performance Total Wellbeing" }: BDCLogoProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <TrendingUp className="w-full h-full text-blue-900" style={{ maxWidth: '48px', maxHeight: '48px' }} />
      </div>
    )
  }

  return (
    <div className="relative">
      {!imageLoaded && (
        <div className={`${className} flex items-center justify-center animate-pulse`}>
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <img
        src="/thrive-logo.svg"
        alt={alt}
        className={`${className} object-contain ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-300`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  )
}
