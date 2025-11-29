import type { Metadata } from "next";
import "./globals.css";

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
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
