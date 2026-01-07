import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gas Station Finder",
  description: "Find the Gas Stations Nearby",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 👇 Runs BEFORE React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    const isDark = localStorage.getItem('fuelFinder_darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`,
          }}
        />

        {children}
      </body>
    </html>
  );
}
