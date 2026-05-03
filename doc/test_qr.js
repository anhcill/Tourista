// Quick test: simulate encodeQrData → decodeQrData cycle
const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const encodeQrData = (booking) => {
  const isTourBooking = booking.bookingType === 'TOUR' || (!!booking.tourId && !booking.hotelId);

  const payload = {
    bookingCode: booking.bookingCode || '-',
    bookingType: booking.bookingType || (isTourBooking ? 'TOUR' : 'HOTEL'),
    hotelName: isTourBooking
      ? (booking.tourTitle || 'Tour chua xac dinh')
      : (booking.hotelName || 'Khach san chua xac dinh'),
    roomTypeName: isTourBooking
      ? `Khoi hanh: ${formatDate(booking.departureDate)}`
      : (booking.roomTypeName || '-'),
    checkIn: formatDate(booking.checkIn),
    checkOut: formatDate(booking.checkOut),
    departureDate: formatDate(booking.departureDate),
    nights: booking.nights || 0,
    rooms: booking.rooms || 0,
    adults: booking.adults || 0,
    children: booking.children || 0,
    totalAmount: Number(booking.totalAmount) || 0,
    status: 'Da xac nhan',
    createdAt: formatDate(booking.createdAt),
  };

  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return '';
  }
};

const decodeQrData = (raw) => {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

// Simulate a hotel booking
const mockBooking = {
  bookingCode: 'HTB20260503001',
  bookingType: 'HOTEL',
  hotelName: 'Khach San Muong Thanh',
  roomTypeName: 'Phong Deluxe',
  checkIn: '2026-05-10',
  checkOut: '2026-05-13',
  nights: 3,
  rooms: 1,
  adults: 2,
  children: 1,
  totalAmount: 1500000,
  createdAt: '2026-05-03T10:00:00Z',
};

console.log('=== ENCODE ===');
const encoded = encodeQrData(mockBooking);
console.log('Encoded (base64):', encoded.substring(0, 60) + '...');
console.log('Encoded length:', encoded.length, 'chars');

console.log('\n=== DECODE ===');
const decoded = decodeQrData(encoded);
console.log(JSON.stringify(decoded, null, 2));

console.log('\n=== VALIDATION ===');
console.log('hotelName:', decoded?.hotelName);
console.log('roomTypeName:', decoded?.roomTypeName);
console.log('totalAmount:', decoded?.totalAmount, '→ formatted:', formatMoney(decoded?.totalAmount), 'VND');
console.log('checkIn:', decoded?.checkIn);
console.log('checkOut:', decoded?.checkOut);
console.log('nights:', decoded?.nights, 'rooms:', decoded?.rooms);

// QR URL test
const baseOrigin = 'https://touristastudio.com';
const detailUrl = `${baseOrigin}/booking-qr?d=${encodeURIComponent(encoded)}`;
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(detailUrl)}`;
console.log('\n=== QR URL ===');
console.log('URL length:', detailUrl.length, 'chars');
console.log('QR URL:', qrUrl.substring(0, 80) + '...');
