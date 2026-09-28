import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ellyshafatima.com"),
  title: {
    default: "Ellysha Fatima — AI Engineer",
    template: "%s — Ellysha Fatima",
  },
  description:
    "AI engineer building systems people outside engineering can actually use. Three live tools you can try.",
  openGraph: {
    title: "Ellysha Fatima — AI Engineer",
    description:
      "Three live AI tools: a storybook generator, an EU AI Act risk classifier, and a solar tracker with a neural net that trains in your browser.",
    url: "https://ellyshafatima.com",
    siteName: "Ellysha Fatima",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ellysha Fatima — AI Engineer",
    description: "Three live AI tools you can try in your browser.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${instrument.variable} bg-[#0A0A0A] text-[#EDEDED] antialiased font-[family-name:var(--font-inter)]`}
      >
        {children}
      </body>
    </html>
  );
}