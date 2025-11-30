import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Book shop management",
  description: "View all available books,and manage the books you own",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
