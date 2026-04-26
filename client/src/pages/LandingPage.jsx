import LandingNavbar from '../components/shared/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import UseCasesSection from '../components/landing/UseCasesSection';
import AboutSection from '../components/landing/AboutSection';
import DeveloperSection from '../components/landing/DeveloperSection';
import FooterSection from '../components/landing/FooterSection';

const LandingPage = () => (
  <div className="bg-brand-bg text-brand-text transition-colors duration-300">
    <LandingNavbar />
    <HeroSection />
    <StatsSection />
    <FeaturesSection />
    <HowItWorksSection />
    <UseCasesSection />
    <AboutSection />
    <DeveloperSection />
    <FooterSection />
  </div>
);

export default LandingPage;
