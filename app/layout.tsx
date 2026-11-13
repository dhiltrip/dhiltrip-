import type { Metadata, Viewport } from "next";
import { Fredoka, Inter, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TranslateRuntime } from "@/components/TranslateRuntime";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const title = "DhilTrip Explorations - Sustainable Healing Tourism";
const description =
  "Sustainable one-day trips around Yogyakarta with the Leave No Trace Challenge: collect plastic bottles, earn points, and redeem local recycled souvenirs.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dhiltrip.com"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: ["/challenge/poster-code-urban.webp"],
  },
};

// Lets the bottom menu sit above the iPhone home bar.
// themeColor tints the phone browser bar to match the header.
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#0D2A1F" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <TranslateRuntime />
      </body>
    </html>
  );
}
