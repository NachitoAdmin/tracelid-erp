import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ERP System',
  description: 'Next.js ERP Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#f3f4f6' }}>{children}</body>
    </html>
  )
}