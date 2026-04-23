package vn.tourista.service;

import vn.tourista.dto.response.PromotionResponse;
import java.util.List;

public interface PromotionService {
    List<PromotionResponse> getActivePromotions();
}
