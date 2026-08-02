import Header from "./landing/sections/Header";
import Hero from "./landing/sections/Hero";
import BrandMarquee from "./landing/sections/BrandMarquee";
import Pricing from "./landing/sections/Pricing";
import Testimonials from "./landing/sections/Testimonials";
import FAQ from "./landing/sections/FAQ";
import Footer from "./landing/sections/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <BrandMarquee />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
