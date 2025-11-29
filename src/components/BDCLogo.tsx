import React, { useState } from 'react'
import { Flame } from 'lucide-react'

interface ThriveLogoProps {
  className?: string
  alt?: string
}

export function BDCLogo({ className = "h-12 w-auto", alt = "Thrive Wellbeing Logo" }: ThriveLogoProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-900 to-red-600 rounded-lg p-2`}>
        <Flame className="w-full h-full text-white" style={{ maxWidth: '48px', maxHeight: '48px' }} />
      </div>
    )
  }

  return (
    <div className="relative">
      {!imageLoaded && (
        <div className={`${className} flex items-center justify-center bg-gray-200 animate-pulse rounded`}>
          <Flame className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <img
        src="/Thrive Wellbeing Logo.png"
        alt={alt}
        className={`${className} object-contain ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-300`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  )
}
