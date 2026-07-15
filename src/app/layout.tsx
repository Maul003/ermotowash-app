import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/shared/AppLayout";

export const metadata: Metadata = {
  title: "ER Motowash - Cuci Motor Antar Jemput",
  description: "Layanan cuci motor antar-jemput premium on-demand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-gray-150">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
