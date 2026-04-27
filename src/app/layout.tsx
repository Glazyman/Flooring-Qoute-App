import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FloorQuote Pro',
  description: 'Professional flooring estimates in under 2 minutes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
