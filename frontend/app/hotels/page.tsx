import HeroBanner from '@/components/Home/HeroBanner';
import SpecialOffers from '@/components/Home/SpecialOffers/SpecialOffers';
import WhyChooseUs from '@/components/Home/WhyChooseUs/WhyChooseUs';
import ExclusiveHotelSearch from '@/components/Home/ExclusiveHotelSearch/ExclusiveHotelSearch';
import SpecialOfferCategories from '@/components/Home/SpecialOfferCategories/SpecialOfferCategories';
import MakeAComparison from '@/components/Home/MakeAComparison/MakeAComparison';
import Testimonials from '@/components/Home/Testimonials/Testimonials';
import CTACards from '@/components/Home/CTACards/CTACards';

export default function HotelsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <HeroBanner />
        <SpecialOffers />
        <WhyChooseUs />
        <ExclusiveHotelSearch />
        <SpecialOfferCategories />
        <MakeAComparison />
        <Testimonials />
        <CTACards />
      </main>
    </div>
  );
}
