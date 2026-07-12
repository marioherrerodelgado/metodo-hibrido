import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const jb = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Método Híbrido",
  description:
    "Entrenamiento híbrido: running, CrossFit, Hyrox y DEKA en un único plan. Calendario, cargas, skills y carga muscular semanal.",
  applicationName: "Método Híbrido",
  appleWebApp: {
    capable: true,
    title: "Método Híbrido",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Método Híbrido",
    description: "Un método. Cuatro disciplinas. Un solo plan.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${anton.variable} ${jb.variable} h-full`}
    >
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
