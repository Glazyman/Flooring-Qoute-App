import React from 'react'

export interface CardProps {
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
  children: React.ReactNode
  /** Extra padding adjustments — defaults to p-5 */
  padded?: boolean
}

/**
 * Canonical card chrome used across the app.
 * - bg white
 * - rounded-xl (12px)
 * - 1px solid var(--border) (#E5E7EB)
 * - flat — no drop shadow
 */
export function Card({ title, description, className = '', children, padded = true }: CardProps) {
  const padding = padded ? 'p-5' : ''
  return (
    <div
      className={`bg-white rounded-xl ${padding} ${className}`.trim()}
      style={{ border: '1px solid var(--border)' }}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-sm font-semibold text-gray-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xs mt-1 text-gray-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
