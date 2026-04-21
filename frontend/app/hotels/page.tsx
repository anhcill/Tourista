import HeroBanner from '@/components/Home/HeroBanner';
import WhyChooseUs from '@/components/Home/WhyChooseUs/WhyChooseUs';
import SpecialOffers from '@/components/Home/SpecialOffers/SpecialOffers';
import Testimonials from '@/components/Home/Testimonials/Testimonials';
import CTACards from '@/components/Home/CTACards/CTACards';
import TrendingDestinations from '@/components/Home/TrendingDestinations/TrendingDestinations';

export default function HotelsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <HeroBanner />
        <WhyChooseUs />
        <SpecialOffers />
        <TrendingDestinations />
        <Testimonials />
        <CTACards />
      </main>
    </div>
  );
}
