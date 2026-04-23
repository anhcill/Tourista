package vn.tourista.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.PromotionResponse;
import vn.tourista.entity.Promotion;
import vn.tourista.repository.PromotionRepository;
import vn.tourista.service.PromotionService;

import java.time.LocalDateTime;
import java.util.List;

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
}
