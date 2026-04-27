package vn.tourista.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.ValidatePromoRequest;
import vn.tourista.dto.response.PromotionResponse;
import vn.tourista.dto.response.PromoValidationResponse;
import vn.tourista.entity.Promotion;
import vn.tourista.repository.PromotionRepository;
import vn.tourista.service.PromotionService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PromotionServiceImpl implements PromotionService {

    @Autowired
    private PromotionRepository promotionRepository;

    @Override
    public List<PromotionResponse> getActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> promotions = promotionRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> p.getValidFrom() != null && !p.getValidFrom().isAfter(now))
                .filter(p -> p.getValidUntil() != null && !p.getValidUntil().isBefore(now))
                .toList();
        return promotions.stream()
                .map(PromotionResponse::from)
                .toList();
    }

    @Override
    public PromoValidationResponse validatePromo(ValidatePromoRequest request) {
        if (request == null || request.getCode() == null || request.getCode().trim().isEmpty()) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .errorMessage("Mã khuyến mãi không được để trống.")
                    .build();
        }

        String code = request.getCode().trim().toUpperCase();
        Optional<Promotion> promoOpt = promotionRepository.findByCodeIgnoreCase(code);

        if (promoOpt.isEmpty()) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .errorMessage("Mã khuyến mãi không tồn tại.")
                    .build();
        }

        Promotion promo = promoOpt.get();

        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage("Mã khuyến mãi đã bị vô hiệu hóa.")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (promo.getValidFrom() != null && promo.getValidFrom().isAfter(now)) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage("Mã khuyến mãi chưa có hiệu lực.")
                    .build();
        }

        if (promo.getValidUntil() != null && promo.getValidUntil().isBefore(now)) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage("Mã khuyến mãi đã hết hạn sử dụng.")
                    .build();
        }

        if (promo.getUsageLimit() != null && promo.getUsedCount() >= promo.getUsageLimit()) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage("Mã khuyến mãi đã hết lượt sử dụng.")
                    .build();
        }

        String requestAppliesTo = request.getAppliesTo();
        String promoAppliesTo = promo.getAppliesTo() != null ? promo.getAppliesTo().name() : null;
        if (requestAppliesTo != null && promoAppliesTo != null
                && !promoAppliesTo.equals("ALL")
                && !promoAppliesTo.equalsIgnoreCase(requestAppliesTo)) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage("Mã khuyến mãi không áp dụng cho loại đặt hàng này.")
                    .build();
        }

        BigDecimal orderAmount = request.getOrderAmount();
        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage("Số tiền đơn hàng không hợp lệ.")
                    .build();
        }

        BigDecimal minOrder = promo.getMinOrderAmount();
        if (minOrder != null && orderAmount.compareTo(minOrder) < 0) {
                    return PromoValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .name(promo.getName())
                    .errorMessage(
                        String.format("Đơn hàng tối thiểu %s để sử dụng mã này.",
                            java.text.NumberFormat.getCurrencyInstance(java.util.Locale.forLanguageTag("vi-VN"))
                                .format(minOrder.doubleValue())
                                .replace("$", ""))
                    )
                    .build();
        }

        BigDecimal discountAmount;
        if (promo.getDiscountType() == Promotion.DiscountType.PERCENTAGE) {
            discountAmount = orderAmount
                    .multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        } else {
            discountAmount = promo.getDiscountValue();
        }

        BigDecimal maxDiscount = promo.getMaxDiscountAmount();
        if (maxDiscount != null && discountAmount.compareTo(maxDiscount) > 0) {
            discountAmount = maxDiscount;
        }

        discountAmount = discountAmount.min(orderAmount);
        BigDecimal finalAmount = orderAmount.subtract(discountAmount);

        return PromoValidationResponse.builder()
                .valid(true)
                .code(code)
                .name(promo.getName())
                .description(promo.getDescription())
                .discountType(promo.getDiscountType() != null ? promo.getDiscountType().name() : null)
                .discountValue(promo.getDiscountValue())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }
}
