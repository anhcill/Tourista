package vn.tourista.service;

import vn.tourista.dto.request.ValidatePromoRequest;
import vn.tourista.dto.response.PromotionResponse;
import vn.tourista.dto.response.PromoValidationResponse;

import java.util.List;

public interface PromotionService {
    List<PromotionResponse> getActivePromotions();

    PromoValidationResponse validatePromo(ValidatePromoRequest request);
}
