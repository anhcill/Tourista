import dynamic from 'next/dynamic';
import HeroBanner from '@/components/Home/HeroBanner';
import TopAnnouncementBar from '@/components/Ads/TopAnnouncementBar';
import PromoPopup from '@/components/Ads/PromoPopup';
import FloatingGiftWidget from '@/components/Ads/FloatingGiftWidget';

import styles from './page.module.css';

// Reusable Skeleton Loading Fallback
const SectionSkeleton = () => (
    <div className="w-full h-96 flex items-center justify-center bg-gray-50 animate-pulse my-8 rounded-xl">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Đang tải nội dung...</p>
        </div>
    </div>
);

// Dynamic Imports (Code Splitting & Lazy Loading for below-the-fold content)
const TrendingDestinations = dynamic(() => import('@/components/Home/TrendingDestinations/TrendingDestinations'), {
    loading: () => <SectionSkeleton />,
});

const CompareOffers = dynamic(() => import('@/components/Home/CompareOffers/CompareOffers'), {
    loading: () => <SectionSkeleton />,
});

const SpecialOffers = dynamic(() => import('@/components/Home/SpecialOffers/SpecialOffers'), {
    loading: () => <SectionSkeleton />,
});

const SpecialOfferCategories = dynamic(() => import('@/components/Home/SpecialOfferCategories/SpecialOfferCategories'), {
    loading: () => <SectionSkeleton />,
});

const MakeAComparison = dynamic(() => import('@/components/Home/MakeAComparison/MakeAComparison'), {
    loading: () => <SectionSkeleton />,
});

const WhyChooseUs = dynamic(() => import('@/components/Home/WhyChooseUs/WhyChooseUs'), {
    loading: () => <SectionSkeleton />,
});

const TripInspirations = dynamic(() => import('@/components/Home/TripInspirations/TripInspirations'), {
    loading: () => <SectionSkeleton />,
});

const Testimonials = dynamic(() => import('@/components/Home/Testimonials/Testimonials'), {
    loading: () => <SectionSkeleton />,
});

const CTACards = dynamic(() => import('@/components/Home/CTACards/CTACards'), {
    loading: () => <SectionSkeleton />,
});

const Newsletter = dynamic(() => import('@/components/Home/Newsletter/Newsletter'), {
    loading: () => <SectionSkeleton />,
});

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Thanh Thông báo Khuyến mãi */}
            <TopAnnouncementBar />

            {/* Above the Fold Content - Loaded Instantly */}
            <HeroBanner />

            <main className={styles.homeMain}>
                {/* Below the Fold Content - Lazy Loaded */}
                <TrendingDestinations />

                <CompareOffers />
                <SpecialOffers />
                <SpecialOfferCategories />
                <MakeAComparison />
                <WhyChooseUs />
                <TripInspirations />
                <Testimonials />


                <CTACards />

                <Newsletter />

                {/* Floating Widgets & Popups */}
                <PromoPopup />
                <FloatingGiftWidget />
            </main>
        </div>
    );
}
