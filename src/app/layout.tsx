import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthClientProvider from "@/contexts/AuthClientProvider";
import React from "react";
import ConditionalSidebarLayout from '@/components/ConditionalSidebarLayout';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: ["system-ui", "arial"],
  preload: true,
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: ["system-ui", "arial"],
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: ["monospace", "Courier New"],
  preload: true,
});

export const metadata: Metadata = {
  title: "QUBE",
  description: "AI Use Case Management Platform",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthClientProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              try {
                const applyTheme = () => {
                  const saved = localStorage.getItem('theme') || 'system';
                  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = saved === 'dark' || (saved === 'system' && systemDark);
                  const root = document.documentElement;
                  const body = document.body;

                  // Always toggle on root; toggle on body only if it exists
                  root.classList.toggle('dark', isDark);
                  if (body) {
                    body.classList.toggle('dark', isDark);
                  }

                  // Mark theme readiness
                  root.setAttribute('data-theme-ready', 'true');
                };

                if (!document.body && document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', applyTheme);
                } else {
                  applyTheme();
                }
              } catch(e) {
                console.error('Theme initialization error:', e);
              }
            `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} antialiased font-sans bg-background text-foreground text-sm`}
          suppressHydrationWarning
        >
          <ThemeProvider>
            <UserProvider>
              <ConditionalSidebarLayout>{children}</ConditionalSidebarLayout>
            </UserProvider>
          </ThemeProvider>
        </body>
      </html>
    </AuthClientProvider>
  );
}