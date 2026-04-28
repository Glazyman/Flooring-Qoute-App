import React from 'react'

export interface CardProps {
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
  children: React.ReactNode
  /** Extra padding adjustments — defaults to p-5 lg:p-6 */
  padded?: boolean
}

/**
 * Canonical card chrome used across the app.
 * - bg white
 * - rounded-xl
 * - 1px solid var(--border)
 * - var(--shadow-card) (which is `none` in this design system)
 *
 * Lifted out of QuoteForm/SettingsForm/quote detail to enforce consistency.
 */
export function Card({ title, description, className = '', children, padded = true }: CardProps) {
  const padding = padded ? 'p-5 lg:p-6' : ''
  return (
    <div
      className={`bg-white rounded-xl ${padding} ${className}`.trim()}
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
