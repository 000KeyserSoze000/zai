import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { I18nProvider } from "@/lib/i18n"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "ContentPro | Automatisation Contenu YouTube",
  description: "Automatisez votre creation de contenu YouTube avec l'IA. Generation de miniatures, SEO, posts sociaux - tout en un.",
  keywords: ["youtube", "automation", "ai", "content creation", "thumbnails", "seo", "contentpro"],
}

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-black text-white antialiased`}>
        <SessionProvider>
          <I18nProvider>
            <AppSidebar>{children}</AppSidebar>
            <Toaster />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
