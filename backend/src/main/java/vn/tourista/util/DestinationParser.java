package vn.tourista.util;

/**
 * Extracts the primary city/province name from a destination string.
 *
 * Examples:
 *   "Trường Sa, Ngu Hành Son, Da Nang" → "Da Nang"
 *   "Hà Nội"                           → "Hà Nội"
 *   "Phú Quốc, Kiên Giang"             → "Kiên Giang"
 *   "TP. Hồ Chí Minh"                   → "TP. Hồ Chí Minh"
 */
public final class DestinationParser {

    private DestinationParser() {}

    /**
     * Extracts the last comma-separated segment (the most specific location
     * that corresponds to the city/province), strips surrounding whitespace.
     * Returns the full string if no comma is found.
     */
    public static String extractCity(String destination) {
        if (destination == null) return "";
        String trimmed = destination.trim();
        int lastComma = trimmed.lastIndexOf(',');
        if (lastComma < 0) return trimmed;
        return trimmed.substring(lastComma + 1).trim();
    }

    /**
     * Normalized version: removes diacritics + lowercases the extracted city.
     */
    public static String extractNormalizedCity(String destination) {
        return VietnameseNormalizer.normalize(extractCity(destination));
    }
}
