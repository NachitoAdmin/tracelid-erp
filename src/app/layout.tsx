import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/LanguageContext'
import { CurrencyProvider } from '@/lib/CurrencyContext'
import MaintenanceCheck from '@/components/MaintenanceCheck'

export const metadata: Metadata = {
  title: 'Tracelid - Business Intelligence & Analytics',
  description: 'Advanced ERP system for business intelligence, analytics, and transaction management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <CurrencyProvider>
            <MaintenanceCheck>
              {children}
            </MaintenanceCheck>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
