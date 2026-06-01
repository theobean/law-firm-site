import Hero from "@/components/Hero";
import AuctionBanner from "@/components/AuctionBanner";
import PracticeAreasGrid from "@/components/PracticeAreasGrid";
import StatsSection from "@/components/StatsSection";
import AboutTeaser from "@/components/AboutTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AuctionBanner />
      <PracticeAreasGrid preview />
      <StatsSection />
      <AboutTeaser />
    </>
  );
}
