import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { THEME_SCRIPT, ThemeProvider } from "@/lib/theme";

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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-icon.png",
  },
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
  // El proveedor de tema lo reescribe en cliente según el tema activo.
  themeColor: "#faf9f7",
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
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${anton.variable} ${jb.variable} h-full`}
    >
      <head>
        {/* Antes de pintar nada: si no, al cargar en oscuro se vería un
            fogonazo blanco mientras React monta. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Chrome/Android lanza `beforeinstallprompt` al cargar, a veces antes
            de que React monte. Lo guardamos en window para no perderlo y poder
            ofrecer la instalación después. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__mhInstall=e;});",
          }}
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
