import HeroBanner from '@/components/Home/HeroBanner';
import WhyChooseUs from '@/components/Home/WhyChooseUs/WhyChooseUs';
import HotelPageSearch from '@/components/Hotels/HotelPageSearch/HotelPageSearch';
import Testimonials from '@/components/Home/Testimonials/Testimonials';
import CTACards from '@/components/Home/CTACards/CTACards';

export default function HotelsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <HeroBanner />
        <WhyChooseUs />
        <HotelPageSearch />
        <Testimonials />
        <CTACards />
      </main>
    </div>
  );
}
