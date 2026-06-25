import type { Metadata } from "next";
import { Space_Grotesk, Michroma } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import "leaflet/dist/leaflet.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

const michroma = Michroma({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-michroma",
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
      lang="es"
      className={`${spaceGrotesk.variable} ${michroma.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
      </head>
      <body
        className="font-sans min-h-full flex flex-col text-white"
        style={{ background: 'var(--bg-atmospheric)' }}
      >
        <div className="stars-bg"></div>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}