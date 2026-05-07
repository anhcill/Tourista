'use client';

import { useRef, useState } from 'react';
import { FaExpand, FaCompress, FaDirections } from 'react-icons/fa';
import styles from './HotelMap.module.css';

export default function HotelMap({ hotel, className = '' }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hotelLat = hotel?.latitude;
  const hotelLng = hotel?.longitude;
  const hasCoords = hotelLat && hotelLng;

  const query = hasCoords
    ? `${hotelLat},${hotelLng}`
    : encodeURIComponent(`${hotel?.name || ''}, ${hotel?.address || ''}`);

  const embedSrc = `https://maps.google.com/maps?q=${query}&t=m&z=15&output=embed&language=vi`;

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        void containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        void document.exitFullscreen();
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
      '_blank',
    );
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.mapContainer} ${isFullscreen ? styles.fullscreen : ''} ${className}`}
    >
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

      <iframe
        title={`Bản đồ ${hotel?.name || 'Khách sạn'}`}
        className={styles.mapIframe}
        src={embedSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
