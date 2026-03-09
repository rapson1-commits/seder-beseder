import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'סדר בסדר',
  description: 'עושים סדר בחגים המשפחתיים',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'סדר בסדר' },
}

export const viewport: Viewport = {
  themeColor: '#192542',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  )
}
