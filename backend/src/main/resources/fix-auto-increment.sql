-- Fix: Add AUTO_INCREMENT to id columns for all tables using GenerationType.IDENTITY
-- This fixes: "Field 'id' doesn't have a default value"

-- ==================== BOOKINGS TABLE ====================
ALTER TABLE `bookings` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== BOOKING HOTEL DETAILS ====================
ALTER TABLE `booking_hotel_details` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== BOOKING TOUR DETAILS ====================
ALTER TABLE `booking_tour_details` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== USERS TABLE ====================
ALTER TABLE `users` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== HOTELS TABLE ====================
ALTER TABLE `hotels` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== ROOM TYPES TABLE ====================
ALTER TABLE `room_types` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== TOURS TABLE ====================
ALTER TABLE `tours` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== TOUR DEPARTURES TABLE ====================
ALTER TABLE `tour_departures` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== TOUR CATEGORIES TABLE ====================
ALTER TABLE `tour_categories` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== CITIES TABLE ====================
ALTER TABLE `cities` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT;

-- ==================== AMENITIES TABLE ====================
ALTER TABLE `amenities` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT;

-- ==================== REVIEWS TABLE ====================
ALTER TABLE `reviews` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== REVIEW IMAGES TABLE ====================
ALTER TABLE `review_images` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== REVIEW HELPFUL VOTES TABLE ====================
ALTER TABLE `review_helpful_votes` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== FAVORITES TABLE ====================
ALTER TABLE `favorites` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== PROMOTIONS TABLE ====================
ALTER TABLE `promotions` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== PRICING RULES TABLE ====================
ALTER TABLE `pricing_rules` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== ARTICLES TABLE ====================
ALTER TABLE `articles` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== ARTICLE COMMENTS TABLE ====================
ALTER TABLE `article_comments` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== TOUR IMAGES TABLE ====================
ALTER TABLE `tour_images` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== TOUR ITINERARIES TABLE ====================
ALTER TABLE `tour_itineraries` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== HOTEL IMAGES TABLE ====================
ALTER TABLE `hotel_images` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== CONVERSATIONS TABLE ====================
ALTER TABLE `conversations` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== CHAT MESSAGES TABLE ====================
ALTER TABLE `chat_messages` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== CONVERSATION SESSIONS TABLE ====================
ALTER TABLE `conversation_sessions` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== SESSION RECOMMENDATION STATES TABLE ====================
ALTER TABLE `session_recommendation_states` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== REFRESH TOKENS TABLE ====================
ALTER TABLE `refresh_tokens` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== EMAIL VERIFICATION TOKENS TABLE ====================
ALTER TABLE `email_verification_tokens` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== LOGIN ATTEMPTS TABLE ====================
ALTER TABLE `login_attempts` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== AUDIT LOGS TABLE ====================
ALTER TABLE `audit_logs` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- ==================== ROLES TABLE ====================
ALTER TABLE `roles` MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;
