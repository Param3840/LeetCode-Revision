import type { Metadata } from "next";
import "./globals.css";

import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "CodeRevise - LeetCode Revision Dashboard",
  description: "Organize and revise your solved LeetCode problems directly from your CodeRevise sync dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{
        // Set fallback css variables matching what was generated
        colorScheme: "dark",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
