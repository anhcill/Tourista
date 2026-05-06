/**
 * Chat formatting utilities — shared across all chat components.
 */

/**
 * Format clock time from date string.
 */
export function formatClock(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format date label (Hôm nay / Hôm qua / DD/MM/YYYY).
 */
export function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isToday) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Format VND currency.
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get initials from name.
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Unwrap Axios response payload.
 */
export function unwrapPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

/**
 * Unwrap Axios paginated response content.
 */
export function unwrapPageContent(response) {
  return response?.data?.content ?? response?.content ?? response ?? [];
}

/**
 * Extract error message from Axios error.
 */
export function extractErrorMessage(error) {
  if (!error) return 'Không thể kết nối chat lúc này.';
  if (typeof error === 'string') return error;
  if (error?.response?.status === 401) return 'Vui lòng đăng nhập để sử dụng chat.';
  if (error?.response?.status === 403) return 'Bạn không có quyền chat với dịch vụ này.';
  if (error?.response?.status === 404) return 'Không tìm thấy cuộc trò chuyện. Vui lòng thử lại.';
  if (error?.response?.status === 500) return 'Lỗi server. Vui lòng thử lại sau giây lát.';
  return error?.message || error?.data?.message || 'Không thể kết nối chat lúc này.';
}

/**
 * Check if a message belongs to the current user.
 */
export function isOwnMessage(message, currentUserId) {
  if (message?.senderId == null || currentUserId == null) return false;
  return Number(message.senderId) === Number(currentUserId);
}

/**
 * Safe markdown parser — renders **bold** and • bullet lists.
 */
export function parseSafeMarkdown(text) {
  if (!text) return null;
  const segments = [];
  const lines = (text || '').split('\n');
  lines.forEach((line, lineIdx) => {
    if (line.match(/^\s*•\s/) || line.match(/^\s*[-*]\s/)) {
      segments.push(<span key={lineIdx} className={styles.bulletLine}>• {line.replace(/^\s*•\s/, '').replace(/^\s*[-*]\s/, '')}</span>);
    } else {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      parts.forEach((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          segments.push(<strong key={`${lineIdx}-${i}`}>{part.slice(2, -2)}</strong>);
        } else if (part) {
          segments.push(<span key={`${lineIdx}-${i}`}>{part}</span>);
        }
      });
    }
  });
  return segments;
}
