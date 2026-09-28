import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { ThemeProvider, themeBootstrap } from "@/lib/theme";
import { MotionProvider } from "@/components/MotionProvider";
import { HtmlLang } from "@/components/HtmlLang";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://jev-playground.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Jev Playground: typed decisions via OpenRouter",
  description:
    "Compose a state and typed yes/no, choice and score questions, run them against the Jev System One model, and read calibrated probabilities with latency, tokens and cost. Export as Postman or cURL.",
  keywords: [
    "Jev",
    "TypeSafe",
    "System One",
    "OpenRouter",
    "decision model",
    "calibrated probabilities",
    "playground",
    "noul",
    "choice",
    "score",
  ],
  openGraph: {
    title: "Jev Playground: typed decisions via OpenRouter",
    description:
      "Run typed decisions (yes/no, choice, score) against the Jev System One model and see calibrated probabilities, latency, tokens and cost.",
    url: SITE_URL,
    siteName: "Jev Playground",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jev Playground: typed decisions via OpenRouter",
    description:
      "Run typed decisions (yes/no, choice, score) against the Jev System One model and see calibrated probabilities, latency, tokens and cost.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider>
            <MotionProvider>
              <HtmlLang>{children}</HtmlLang>
            </MotionProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}