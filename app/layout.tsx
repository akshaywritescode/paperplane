import type { Metadata, Viewport } from "next";
import "./globals.css";
import { griffy, montserrat, poppins } from "./font";
import { TooltipProvider } from "@/components/ui/tooltip";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Paperplane — Where API Takes Flight",
    template: "%s | Paperplane",
  },
  description:
    "Compose requests, inspect responses, and organize API workflows in a calm workspace built for modern teams.",
  keywords: [
    "API testing",
    "REST client",
    "HTTP client",
    "API client",
    "API workspace",
    "Postman alternative",
  ],
  authors: [{ name: "Paperplane" }],
  creator: "Paperplane",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Paperplane",
    title: "Paperplane — Where API Takes Flight",
    description:
      "Compose requests, inspect responses, and organize API workflows in a calm workspace built for modern teams.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Paperplane — Where API Takes Flight",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paperplane — Where API Takes Flight",
    description:
      "Compose requests, inspect responses, and organize API workflows in a calm workspace built for modern teams.",
    images: ["/opengraph-image.png"],
    creator: "@paperplaneapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.className} ${poppins.variable} ${montserrat.variable} ${griffy.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script: reads localStorage before first paint to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            `.trim(),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
