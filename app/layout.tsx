import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import ReduxProvider from "@/redux/provider";
import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "GrowthMe — Financial Tracker",
  description:
    "Your personal financial operating system. Track income, expenses, accounts, and get AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", inter.variable, "font-sans")}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ReduxProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ReduxProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "oklch(0.16 0.008 260)",
              border: "1px solid oklch(0.25 0.015 260)",
              color: "oklch(0.95 0.01 260)",
            },
          }}
        />
      </body>
    </html>
  );
}
