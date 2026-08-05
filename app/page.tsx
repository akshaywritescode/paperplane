import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import Header from "./landing/sections/Header";
import Hero from "./landing/sections/Hero";
import BrandMarquee from "./landing/sections/BrandMarquee";
import Pricing from "./landing/sections/Pricing";
import Testimonials from "./landing/sections/Testimonials";
import FAQ from "./landing/sections/FAQ";
import Footer from "./landing/sections/Footer";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Paperplane",
  applicationCategory: "DeveloperApplication",
  description:
    "Compose requests, inspect responses, and organize API workflows in a calm workspace built for modern teams.",
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: "19",
    priceCurrency: "USD",
  },
  operatingSystem: "Web",
};

export default async function Home() {
  const user = await getCurrentAppwriteUser();

  if (user?.emailVerification) {
    redirect("/dashboard");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <Header />
        <Hero />
        <BrandMarquee />
        <Pricing />
        <Testimonials />
        <FAQ />
        <Footer />
      </main>
    </>
  );
}
