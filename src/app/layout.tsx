import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const heading = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Fondée — Créez, modifiez ou fermez votre société en ligne",
  description:
    "Fondée accompagne la création, la modification et la fermeture de société en France, avec relecture et dépôt par un expert-comptable.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${heading.variable} ${body.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
