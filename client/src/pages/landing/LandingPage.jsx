import AnimatedBackground from '../../components/ui/AnimatedBackground'
import Navbar from '../../components/layout/Navbar'
import HeroSection from './HeroSection'
import ProblemSection from './ProblemSection'
import HowItWorksSection from './HowItWorksSection'
import FeaturesSection from './FeaturesSection'
import TechnologySection from './TechnologySection'
import MissionSection from './MissionSection'
import CTASection from './CTASection'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-charcoal-950 overflow-x-hidden">
      {/* Living background — always behind everything */}
      <AnimatedBackground />

      {/* Content layers */}
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TechnologySection />
        <MissionSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  )
}