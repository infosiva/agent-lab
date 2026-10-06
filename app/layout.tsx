import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { MotionProvider } from '@infosiva/shared-ui/modern'
import { AnimatedBg } from '@/components/AnimatedBg'
import Telemetry from '@/components/Telemetry'
import FeedbackButton from '@/components/FeedbackButton'
import FloatingChatWrapper from '@/components/FloatingChatWrapper'
import { loadSiteTheme, buildThemeStyleTag, buildGa4Snippet, isValidGa4Id } from '@/lib/theme-loader'

// Theme is read from Edge Config (cached 600s in the loader); re-render on the same cadence.
export const revalidate = 600

const SITE_ID = 'agent-lab'
const DEFAULT_ARCHETYPE = 'travel-magazine'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'agent-lab: RAG agent over your codebase',
  description: 'Ask questions about an ingested codebase. A plan, retrieve, synthesize, critique agent answers with sources.',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.svg' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await loadSiteTheme(SITE_ID)
  const ga4 = theme?.analytics?.ga4Id
  return (
    <html lang="en" data-layout={theme?.layout?.archetype ?? DEFAULT_ARCHETYPE} className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <style id="hub-theme" dangerouslySetInnerHTML={{ __html: buildThemeStyleTag(theme) }} />
        {isValidGa4Id(ga4) && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: buildGa4Snippet(theme) }} />
          </>
        )}
      </head>
      <body>
        <AnimatedBg theme={theme} fallback="mesh" />
        <MotionProvider>{children}</MotionProvider>
        <FloatingChatWrapper />
        <FeedbackButton />
        <Telemetry />
      </body>
    </html>
  )
}
