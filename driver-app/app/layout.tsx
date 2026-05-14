import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "@/app/components/ThemeProvider";
import "./globals.css";
import "leaflet/dist/leaflet.css";


const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "DriveMe - Drivers",
  description: "Administra tus viajes, monitorea tu historial y mantente al tanto de tu actividad con DriveMe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${spaceGrotesk.variable} h-full antialiased`}
        suppressHydrationWarning /* Vital para evitar el flash blanco y errores de Next.js */
      >
        <body
          className="min-h-full flex flex-col transition-colors duration-300"
          style={{
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            fontFamily: "var(--font-space-grotesk)"
          }}
          suppressHydrationWarning /* Doble escudo de hidratación */
        >
          {/* Envolvemos a los hijos en el proveedor de temas */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}