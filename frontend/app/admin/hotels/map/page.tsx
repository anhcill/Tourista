'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft, FaFilter, FaHotel, FaMapMarkerAlt, FaSearch, FaStar, FaSyncAlt
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import styles from './page.module.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';

export default function AdminHotelMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  interface HotelMapItem {
    id: number;
    name: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
    avgRating?: number | string;
    reviewCount?: number;
    starRating?: number;
    cityName?: string;
    coverImage?: string;
  }

  const [hotels, setHotels] = useState<HotelMapItem[]>([]);
  const [cities, setCities] = useState<{ id: number; name?: string; nameVi?: string; nameEn?: string; hotelCount?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCity, setSelectedCity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<HotelMapItem | null>(null);
  const [hoveredHotel, setHoveredHotel] = useState<HotelMapItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mapRes, citiesRes] = await Promise.all([
        adminApi.getHotelsForMap({ city: selectedCity, limit: 500 }),
        adminApi.getCitiesWithHotels(),
      ]);
      setHotels(mapRes?.data?.data || mapRes?.result || []);
      setCities(citiesRes?.data?.data || citiesRes?.result || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'response' in err ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || String(err)) : String(err));
      setError('Lỗi tải dữ liệu: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || mapInstanceRef.current) return;

        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const mapEl = mapRef.current;
        if (!mapEl) return;
        if ((mapEl as unknown as Record<string, unknown>)._leaflet_id) {
          (mapEl as unknown as Record<string, unknown>)._leaflet_id = null;
        }

        const map = L.map(mapEl, {
          center: [16.0544, 108.2022],
          zoom: 8,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err) {
        console.error('Map init error:', err);
        if (isMounted) setMapError(true);
      }
    };

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as unknown as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const renderMarkers = async () => {
      const L = (await import('leaflet')).default;

      markersRef.current.forEach((m: unknown) => (m as { remove: () => void }).remove());
      markersRef.current = [];

      const bounds: [number, number][] = [];
      const mapInst = mapInstanceRef.current;
      if (!mapInst) return;

      hotels.forEach(hotel => {
        if (!hotel.latitude || !hotel.longitude) return;
        const lat = Number(hotel.latitude);
        const lng = Number(hotel.longitude);

        if (searchQuery && !hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
            && !hotel.address?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
        }

        const isSelected = selectedHotel?.id === hotel.id;
        const isHovered = hoveredHotel?.id === hotel.id;

        const rating = Number(hotel.avgRating || 0);
        let color = '#64748b';
        if (rating >= 4.5) color = '#e53e3e';
        else if (rating >= 4.0) color = '#dd6b20';
        else if (rating >= 3.5) color = '#d69e2e';
        else color = '#3182ce';

        const size = isSelected || isHovered ? 44 : 36;

        const markerIcon = L.divIcon({
          html: `<div style="
            background: ${color};
            border: ${isSelected ? '3px solid #1a202c' : isHovered ? '3px solid #3182ce' : '2px solid white'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 ${isSelected || isHovered ? '4' : '2'}px ${isSelected || isHovered ? '12' : '6'}px rgba(0,0,0,${isSelected || isHovered ? '0.4' : '0.2'});
            transition: all 0.2s;
          ">
            <span style="transform: rotate(45deg); font-size: ${isSelected || isHovered ? '18' : '14'}px;">🏨</span>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
          className: '',
        });

        const marker = L.marker([lat, lng], { icon: markerIcon })
          .addTo(mapInst);

        marker.bindPopup(`
          <div style="min-width: 200px; font-family: 'Inter', sans-serif;">
            <strong style="font-size: 14px; color: #1a202c;">${hotel.name}</strong>
            <p style="margin: 4px 0 2px; font-size: 12px; color: #718096;">${hotel.address || ''}</p>
            <p style="margin: 2px 0; font-size: 12px;">${'⭐'.repeat(hotel.starRating || 3)} ${Number(hotel.avgRating || 0).toFixed(1)}/5 (${hotel.reviewCount || 0} reviews)</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #3182ce;">📍 ${hotel.cityName || ''}</p>
            <a href="/admin/hotels/${hotel.id}/edit" target="_blank" style="display:inline-block;margin-top:6px;padding:4px 10px;background:#3b82f6;color:white;border-radius:4px;font-size:12px;text-decoration:none;">Sửa</a>
          </div>
        `);

        marker.on('click', () => {
          setSelectedHotel(hotel);
        });

        marker.on('mouseover', () => {
          setHoveredHotel(hotel);
        });

        marker.on('mouseout', () => {
          setHoveredHotel(null);
        });

        markersRef.current.push(marker);
        bounds.push([lat, lng]);
      });

      if (bounds.length > 0) {
        mapInst.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    };

    void renderMarkers();
  }, [hotels, mapLoaded, selectedHotel, hoveredHotel, searchQuery]);

  const filteredHotels = hotels.filter(h => {
    if (!searchQuery) return true;
    return h.name?.toLowerCase().includes(searchQuery.toLowerCase())
        || h.address?.toLowerCase().includes(searchQuery.toLowerCase())
        || h.cityName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCityChange = (cityId) => {
    setSelectedCity(cityId);
    setSelectedHotel(null);
  };

  const handleHotelClick = (hotel) => {
    setSelectedHotel(hotel);
    if (mapInstanceRef.current && hotel.latitude && hotel.longitude) {
      (mapInstanceRef.current as unknown as { setView: (center: [number, number], zoom: number, opts?: object) => void }).setView([Number(hotel.latitude), Number(hotel.longitude)], 15, { animate: true });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/hotels" className={styles.backBtn}>
          <FaArrowLeft /> Quay lại
        </Link>
        <h1 className={styles.title}>Bản đồ Khách sạn</h1>
        <div className={styles.statsBadge}>
          <FaHotel /> {filteredHotels.length} / {hotels.length} khách sạn có tọa độ
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FaSearch />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khách sạn trên bản đồ..."
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value)}
          className={styles.citySelect}
        >
          <option value="ALL">Tất cả thành phố ({hotels.length})</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>
              {c.nameVi || c.nameEn} ({c.hotelCount})
            </option>
          ))}
        </select>

        <button className={styles.refreshBtn} onClick={() => void loadData()}>
          <FaSyncAlt /> Tải lại
        </button>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <FaFilter /> {error}
        </div>
      )}

      <div className={styles.layout}>
        {/* Map */}
        <div className={styles.mapArea}>
          <div className={styles.mapWrapper}>
            {!mapLoaded && !mapError && (
              <div className={styles.mapLoading}>
                <div className={styles.loadingPulse} />
                <p>Đang tải bản đồ...</p>
              </div>
            )}
            <div ref={mapRef} className={styles.mapCanvas} />

            {mapError && (
              <div className={styles.mapError}>
                <p>Không thể tải bản đồ. Vui lòng thử lại.</p>
              </div>
            )}

            {/* Legend */}
            <div className={styles.legend}>
              <span className={styles.legendTitle}>Chú thích:</span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#e53e3e' }} /> Rating 4.5+
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#dd6b20' }} /> Rating 4.0+
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#d69e2e' }} /> Rating 3.5+
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3182ce' }} /> Rating &lt; 3.5
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Danh sách ({filteredHotels.length})</h3>
          </div>

          {loading ? (
            <div className={styles.sidebarLoading}>
              <div className={styles.loadingPulse} />
              <p>Đang tải...</p>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className={styles.emptyState}>
              <FaMapMarkerAlt />
              <p>Không có khách sạn nào</p>
            </div>
          ) : (
            <div className={styles.hotelList}>
              {filteredHotels.map(hotel => (
                <div
                  key={hotel.id}
                  className={`${styles.hotelCard} ${selectedHotel?.id === hotel.id ? styles.hotelCardActive : ''}`}
                  onClick={() => handleHotelClick(hotel)}
                  onMouseEnter={() => setHoveredHotel(hotel)}
                  onMouseLeave={() => setHoveredHotel(null)}
                >
                  {hotel.coverImage && (
                    <img
                      src={hotel.coverImage}
                      alt={hotel.name}
                      className={styles.hotelThumb}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className={styles.hotelInfo}>
                    <div className={styles.hotelName}>{hotel.name}</div>
                    <div className={styles.hotelAddress}>
                      <FaMapMarkerAlt /> {hotel.address || '-'}
                    </div>
                    <div className={styles.hotelMeta}>
                      <span className={styles.ratingBadge}>
                        <FaStar /> {Number(hotel.avgRating || 0).toFixed(1)}
                      </span>
                      <span className={styles.starBadge}>{'⭐'.repeat(hotel.starRating || 3)}</span>
                      <span className={styles.reviewCount}>{hotel.reviewCount || 0} reviews</span>
                    </div>
                    <div className={styles.hotelCity}>{hotel.cityName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
