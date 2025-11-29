import QueryProviderWrapper from "@/lib/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {/* Navbar */}
      <QueryProviderWrapper>{children}</QueryProviderWrapper>
    </div>
  );
}
