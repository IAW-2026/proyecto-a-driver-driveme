import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

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
      >
        <body
          className="min-h-full flex flex-col"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-space-grotesk)" }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
