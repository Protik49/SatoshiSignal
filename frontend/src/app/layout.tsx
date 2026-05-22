import type { Metadata } from "next"
import { Inter, Inconsolata } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
})

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  weight: ["600"],
})

export const metadata: Metadata = {
  title: "SatoshiSignal — AI-Powered Bitcoin Prediction Market Intelligence",
  description:
    "Real-time Bitcoin price predictions, sentiment analysis, and market intelligence powered by AI.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${inconsolata.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-midnight-oil text-cloud-white">
        {children}
      </body>
    </html>
  )
}
