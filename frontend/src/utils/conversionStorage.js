const PRICE_ALERTS_KEY = "tourista_price_alerts_v1";
const TOUR_BOOKING_DRAFTS_KEY = "tourista_tour_booking_drafts_v1";
const TOUR_BOOKING_DRAFT_TTL_MS = 1000 * 60 * 60 * 48;

const hasWindow = () => typeof window !== "undefined";

const safeParse = (raw, fallbackValue) => {
  if (!raw) return fallbackValue;
  try {
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
};

const normalizeHotelSearchQuery = (query) => ({
  city: String(query?.city || "")
    .trim()
    .toLowerCase(),
  checkIn: String(query?.checkIn || "").trim(),
  checkOut: String(query?.checkOut || "").trim(),
  adults: Number(query?.adults || 0),
  rooms: Number(query?.rooms || 0),
  children: Number(query?.children || 0),
});

const createPriceAlertId = (query) => {
  const normalized = normalizeHotelSearchQuery(query);
  return [
    normalized.city,
    normalized.checkIn,
    normalized.checkOut,
    normalized.adults,
    normalized.rooms,
    normalized.children,
  ].join("__");
};

const readPriceAlerts = () => {
  if (!hasWindow()) return [];
  return safeParse(window.localStorage.getItem(PRICE_ALERTS_KEY), []);
};

const writePriceAlerts = (alerts) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
};

export const findPriceAlertForQuery = (query) => {
  const alertId = createPriceAlertId(query);
  return (
    readPriceAlerts().find((alert) => String(alert?.id) === alertId) || null
  );
};

export const upsertPriceAlert = ({ query, targetPrice }) => {
  const normalizedQuery = normalizeHotelSearchQuery(query);
  const nextAlert = {
    id: createPriceAlertId(normalizedQuery),
    query: normalizedQuery,
    targetPrice: Math.max(0, Number(targetPrice || 0)),
    createdAt: new Date().toISOString(),
  };

  const alerts = readPriceAlerts();
  const withoutCurrent = alerts.filter(
    (alert) => String(alert?.id) !== nextAlert.id,
  );
  const nextAlerts = [nextAlert, ...withoutCurrent].slice(0, 25);
  writePriceAlerts(nextAlerts);
  return nextAlert;
};

export const removePriceAlertById = (alertId) => {
  const alerts = readPriceAlerts();
  const nextAlerts = alerts.filter(
    (alert) => String(alert?.id) !== String(alertId),
  );
  writePriceAlerts(nextAlerts);
};

const buildTourDraftKey = (context) => {
  const tourId = Number(context?.tourId || 0);
  const departureId = Number(context?.departureId || 0);
  const departureDate = String(context?.departureDate || "").trim();
  const adults = Number(context?.adults || 0);
  const children = Number(context?.children || 0);

  return [tourId, departureId, departureDate, adults, children].join("__");
};

const readTourDrafts = () => {
  if (!hasWindow()) return {};
  return safeParse(window.localStorage.getItem(TOUR_BOOKING_DRAFTS_KEY), {});
};

const writeTourDrafts = (drafts) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(TOUR_BOOKING_DRAFTS_KEY, JSON.stringify(drafts));
};

export const loadTourBookingDraft = (context) => {
  const key = buildTourDraftKey(context);
  if (!key) return null;

  const drafts = readTourDrafts();
  const draft = drafts[key];
  if (!draft) return null;

  const savedAt = Number(draft?.savedAt || 0);
  const isExpired =
    savedAt <= 0 || Date.now() - savedAt > TOUR_BOOKING_DRAFT_TTL_MS;
  if (isExpired) {
    delete drafts[key];
    writeTourDrafts(drafts);
    return null;
  }

  return draft;
};

export const saveTourBookingDraft = (context, form) => {
  const key = buildTourDraftKey(context);
  if (!key) return;

  const drafts = readTourDrafts();
  drafts[key] = {
    key,
    form,
    savedAt: Date.now(),
    context: {
      tourId: Number(context?.tourId || 0),
      departureId: Number(context?.departureId || 0),
      departureDate: String(context?.departureDate || "").trim(),
      adults: Number(context?.adults || 0),
      children: Number(context?.children || 0),
    },
  };

  writeTourDrafts(drafts);
};

export const clearTourBookingDraft = (context) => {
  const key = buildTourDraftKey(context);
  if (!key) return;

  const drafts = readTourDrafts();
  if (!drafts[key]) return;

  delete drafts[key];
  writeTourDrafts(drafts);
};
