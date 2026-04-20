'use client';

import { useEffect, useRef, useState } from 'react';
import { FaExpand, FaCompress, FaMapMarkerAlt, FaDirections } from 'react-icons/fa';
import styles from './HotelMap.module.css';

const POI_ICONS = {
  airport: '✈️',
  restaurant: '🍽️',
  cafe: '☕',
  atm: '🏧',
  mall: '🛍️',
  park: '🌳',
  hospital: '🏥',
  beach: '🏖️',
  default: '📍',
};

function getIconForType(type) {
  return POI_ICONS[type] || POI_ICONS.default;
}

function getLatLngFromAddress(address, hotelName) {
  return null;
}

export default function HotelMap({ hotel, className = '' }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [activeMarker, setActiveMarker] = useState(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hotelLat = hotel?.latitude;
  const hotelLng = hotel?.longitude;
  const hasCoords = hotelLat && hotelLng;

  // Build nearby POI from hotel data or generate mock
  const nearbyPois = generateNearbyPois(hotel);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        // Dynamically import leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;

        // Fix default marker icon path issue with webpack
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const mapEl = mapRef.current;
        if (!mapEl) return;
        const lat = hasCoords ? Number(hotelLat) : 16.0544;
        const lng = hasCoords ? Number(hotelLng) : 108.2022;

        const map = L.map(mapEl as HTMLElement, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);

        // Hotel marker (red)
        const hotelIcon = L.divIcon({
          html: `<div style="
            background: #e53e3e;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg); font-size: 16px; color: white;">🏨</span>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
          className: '',
        });

        const hotelMarker = L.marker([lat, lng], { icon: hotelIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 180px; font-family: 'Inter', sans-serif;">
              <strong style="font-size: 14px; color: #1a202c;">${hotel?.name || 'Khách sạn'}</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: #718096;">${hotel?.address || ''}</p>
              ${hasCoords ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;font-size:12px;color:#3182ce;text-decoration:none;">📍 Chỉ đường</a>` : ''}
            </div>
          `);
        markersRef.current.push(hotelMarker);

        // POI markers (blue)
        nearbyPois.forEach((poi) => {
          if (!poi.lat || !poi.lng) return;
          const poiIcon = L.divIcon({
            html: `<div style="
              background: white;
              border: 2px solid #3182ce;
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">${getIconForType(poi.type)}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14],
            className: '',
          });

          const marker = L.marker([poi.lat, poi.lng], { icon: poiIcon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 160px; font-family: 'Inter', sans-serif;">
                <strong style="font-size: 13px; color: #1a202c;">${poi.name}</strong>
                <p style="margin: 3px 0 0; font-size: 11px; color: #718096;">${poi.typeLabel}</p>
                <p style="margin: 2px 0 0; font-size: 11px; color: #4a5568;">📏 ${poi.distanceKm?.toFixed(1)} km</p>
              </div>
            `);
          markersRef.current.push(marker);
        });

        // Auto-open hotel popup after a short delay
        setTimeout(() => {
          hotelMarker.openPopup();
        }, 800);
      } catch (err) {
        console.error('Map init error:', err);
        setMapError(true);
      }
    };

    void initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    const searchQuery = encodeURIComponent(`${hotel?.name || ''} ${hotel?.address || ''}`);
    if (hasCoords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${hotelLat},${hotelLng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
    }
  };

  const handleGetDirections = () => {
    if (!hasCoords) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${hotelLat},${hotelLng}`,
      '_blank'
    );
  };

  return (
    <div ref={containerRef} className={`${styles.mapContainer} ${isFullscreen ? styles.fullscreen : ''} ${className}`}>
      <div className={styles.mapControls}>
        <button
          className={styles.controlBtn}
          onClick={handleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Phóng to bản đồ'}
        >
          {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
        </button>
        <button className={styles.controlBtn} onClick={handleOpenGoogleMaps} title="Mở trên Google Maps">
          <span style={{ fontSize: 13 }}>🌐</span>
        </button>
        {hasCoords && (
          <button className={styles.controlBtn} onClick={handleGetDirections} title="Chỉ đường">
            <FaDirections size={14} />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#e53e3e' }} /> Khách sạn</span>
        <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#3182ce' }} /> Địa điểm gần đó</span>
      </div>

      {/* POI chips */}
      <div className={styles.poiChips}>
        {nearbyPois.slice(0, 5).map((poi) => (
          <span key={poi.name} className={styles.poiChip}>
            {getIconForType(poi.type)} {poi.name}
          </span>
        ))}
      </div>

      {/* Map fallback: Google Maps embed iframe */}
      {mapError && (
        <div className={styles.mapFallback}>
          <iframe
            title={`Map of ${hotel?.name || 'Hotel'}`}
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: 12 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${hotel?.name || ''}, ${hotel?.address || ''}`)}&output=embed`}
          />
        </div>
      )}

      {/* Map canvas */}
      <div
        ref={mapRef}
        className={`${styles.mapCanvas} ${mapError ? styles.hidden : ''}`}
      />

      {!mapLoaded && !mapError && (
        <div className={styles.mapLoading}>
          <div className={styles.loadingPulse} />
          <p>Đang tải bản đồ...</p>
        </div>
      )}
    </div>
  );
}

function generateNearbyPois(hotel) {
  if (!hotel?.latitude || !hotel?.longitude) return getDefaultPois();
  const lat = Number(hotel.latitude);
  const lng = Number(hotel.longitude);

  return getDefaultPois().map((poi) => ({
    ...poi,
    lat: lat + (Math.random() - 0.5) * 0.015,
    lng: lng + (Math.random() - 0.5) * 0.015,
  }));
}

function getDefaultPois() {
  return [
    { name: 'Nhà hàng địa phương', type: 'restaurant', typeLabel: 'Nhà hàng', distanceKm: 0.3, lat: null, lng: null },
    { name: 'Quán cà phê', type: 'cafe', typeLabel: 'Café', distanceKm: 0.2, lat: null, lng: null },
    { name: 'Cây ATM', type: 'atm', typeLabel: 'ATM / Ngân hàng', distanceKm: 0.4, lat: null, lng: null },
    { name: 'Công viên', type: 'park', typeLabel: 'Công viên', distanceKm: 0.6, lat: null, lng: null },
    { name: 'Bãi biển', type: 'beach', typeLabel: 'Bãi biển', distanceKm: 1.2, lat: null, lng: null },
  ];
}
