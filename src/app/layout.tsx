import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const serif = Cinzel({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Instituto Shema — Paraguay", template: "%s | Instituto Shema" },
  description:
    "Instituto Shema: escuela bíblica online de la Congregación Shema Israel (Paraguay). Cursos, libros y certificados con el Pastor Félix Guerrero.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PY" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
