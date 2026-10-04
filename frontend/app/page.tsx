import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import EditorialSection from "@/components/EditorialSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar />

      <main>
        <Hero />

        <CategorySection />

        <FeaturedProducts />

        <EditorialSection />

        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}