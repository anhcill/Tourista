// Chat Types — shared across chat components

export type ContentType =
  | 'TEXT'
  | 'IMAGE'
  | 'BOOKING_DETAILS'
  | 'TOUR_CARDS'
  | 'SCENARIO_CHOICE'
  | 'FAQ_MENU'
  | 'SYSTEM_LOG';

export interface ChatMessage {
  id?: number;
  conversationId?: number;
  senderId?: number | null;
  senderName?: string;
  senderAvatar?: string;
  contentType: ContentType;
  content: string | null;
  metadata?: string | null;
  isRead?: boolean;
  createdAt?: string | null;
}

export interface Conversation {
  id: number;
  type: 'BOT' | 'P2P_TOUR' | 'P2P_HOTEL';
  clientId: number;
  partnerId?: number | null;
  referenceId?: number | null;
  bookingId?: number | null;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string | null;
  lastMessageType?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface ScenarioChoice {
  id: string;
  emoji: string;
  label: string;
  payload: string;
}

export interface ScenarioChoiceMetadata {
  question: string;
  subtitle?: string;
  choices: ScenarioChoice[];
}

export interface FaqMenuItem {
  id: string;
  emoji: string;
  label: string;
  payload: string;
}

export interface FaqMenuMetadata {
  title?: string;
  subtitle?: string;
  items: FaqMenuItem[];
}

export interface TourCardItem {
  id: number;
  title: string;
  slug?: string;
  cityVi: string;
  durationDays: number;
  durationNights: number;
  pricePerAdult: number;
  avgRating?: number;
  reviewCount?: number;
  imageUrl?: string | null;
}

export interface BookingDetailsMetadata {
  bookingCode: string;
  bookingType: 'TOUR' | 'HOTEL';
  status: string;
  totalAmount: number;
  currency?: string;
  specialRequests?: string | null;
  partner?: {
    id: number;
    name: string;
    avatar?: string | null;
    phone?: string | null;
  } | null;
  // Tour fields
  tourTitle?: string;
  departureDate?: string;
  durationDays?: number;
  durationNights?: number;
  numAdults?: number;
  numChildren?: number;
  pricePerAdult?: number;
  pricePerChild?: number;
  includes?: string;
  excludes?: string;
  highlights?: string;
  itinerary?: { day: number; title: string; description?: string }[];
  // Hotel fields
  hotelName?: string;
  hotelAddress?: string;
  roomTypeName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
  numRooms?: number;
  adults?: number;
  children?: number;
  pricePerNight?: number;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface QuickPrompt {
  label: string;
  text: string;
}

export interface ConciergeContext {
  favorites: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
}

export interface PendingMessage {
  tempId: string;
  content: string;
  createdAt: string;
}
