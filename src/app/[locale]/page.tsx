import Hero from "@/components/Hero";
import PracticeAreasGrid from "@/components/PracticeAreasGrid";
import StatsSection from "@/components/StatsSection";
import AboutTeaser from "@/components/AboutTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PracticeAreasGrid preview />
      <StatsSection />
      <AboutTeaser />
    </>
  );
}
