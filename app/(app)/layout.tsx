import Navbar from "@/components/layout/Navbar";
import QueryProviderWrapper from "@/lib/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <QueryProviderWrapper>
        <Navbar />
        {children}
      </QueryProviderWrapper>
    </div>
  );
}
