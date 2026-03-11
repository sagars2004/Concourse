import { Header } from "@/components/header";
import { HomeHero } from "@/components/home-hero";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <HomeHero />
      <Footer />
    </div>
  );
}
