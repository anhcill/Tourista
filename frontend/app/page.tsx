import HeroBanner from '@/components/Home/HeroBanner';
import TrendingDestinations from '@/components/Home/TrendingDestinations/TrendingDestinations';
import SpecialOffers from '@/components/Home/SpecialOffers/SpecialOffers';
import WhyChooseUs from '@/components/Home/WhyChooseUs/WhyChooseUs';
import TripInspirations from '@/components/Home/TripInspirations/TripInspirations';
import Testimonials from '@/components/Home/Testimonials/Testimonials';
import CTACards from '@/components/Home/CTACards/CTACards';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner />

      <main className={styles.homeMain}>
        <TrendingDestinations />
        <SpecialOffers />
        <WhyChooseUs />
        <TripInspirations />
        <Testimonials />
        <CTACards />
      </main>
    </div>
  );
}
