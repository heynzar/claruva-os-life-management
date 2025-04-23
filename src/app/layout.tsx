import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JornadOS - Life Management",
  description:
    "A comprehensive life management system to organize and enhance your daily life.",
  authors: [{ name: "nzar.dev" }],
  keywords: [
    "JornadOS",
    "life management",
    "productivity app",
    "task management",
    "organization",
    "time management",
    "goal tracking",
    "habit building",
    "personal growth",
    "mindfulness",
    "focus",
    "efficiency",
  ],
  metadataBase: new URL("https://claruva.com"),
  openGraph: {
    title: "JornadOS - Life Management",
    description:
      "JornadOS is your ultimate tool for managing tasks, tracking goals, and building habits to achieve a balanced and productive life.",
    url: "https://jornadOS.com",
    siteName: "JornadOS",
    images: [
      {
        url: "/jornados-cover.png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JornadOS - Life Management",
    description:
      "JornadOS is your ultimate tool for managing tasks, tracking goals, and building habits to achieve a balanced and productive life.",
    images: ["/jornados-cover.png"],
  },
  alternates: {
    canonical: "https://jornadOS.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
