import type { Metadata } from "next";
import "./globals.css";
import { poppins, montserrat } from "./font";

export const metadata: Metadata = {
  title: "Paperplane - Where API Takes Flight",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
