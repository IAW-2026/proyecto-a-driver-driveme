import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import Nav from "@/app/components/Nav";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
    <html
      lang="es" // Cambiado a español
      className={`${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="font-sans min-h-full flex flex-col transition-colors duration-300 bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white"
      >
        <ClerkProvider>
          <ThemeProvider>
            <Nav />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}