import { Header } from "@/components/header";
import { HomeHero } from "@/components/home-hero";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <HomeHero />
      <Footer />
    </div>
  );
}
