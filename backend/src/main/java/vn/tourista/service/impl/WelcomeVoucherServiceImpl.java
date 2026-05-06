package vn.tourista.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.WelcomeVoucherResponse;
import vn.tourista.entity.Promotion;
import vn.tourista.entity.User;
import vn.tourista.repository.PromotionRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.WelcomeVoucherService;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class WelcomeVoucherServiceImpl implements WelcomeVoucherService {

    private static final String WELCOME_CODE = "WELCOME500K";

    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;

    @Override
    public WelcomeVoucherResponse getWelcomeVoucher(User user) {
        Promotion promo = promotionRepository.findByCodeIgnoreCase(WELCOME_CODE).orElse(null);

        if (promo == null || !Boolean.TRUE.equals(promo.getIsActive())) {
            return WelcomeVoucherResponse.builder()
                    .hasVoucher(false)
                    .claimable(false)
                    .claimed(false)
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        boolean isValid = (promo.getValidFrom() == null || !promo.getValidFrom().isAfter(now))
                && (promo.getValidUntil() == null || !promo.getValidUntil().isBefore(now));
        boolean isAvailable = promo.getUsageLimit() == null
                || promo.getUsedCount() < promo.getUsageLimit();

        boolean claimed = user != null && Boolean.TRUE.equals(user.getWelcomeVoucherClaimed());
        boolean claimable = isValid && isAvailable && !claimed;

        return WelcomeVoucherResponse.builder()
                .hasVoucher(true)
                .code(promo.getCode())
                .name(promo.getName())
                .discountValue(promo.getDiscountValue() != null ? promo.getDiscountValue().intValue() : 500000)
                .minOrderAmount(promo.getMinOrderAmount() != null ? promo.getMinOrderAmount().intValue() : 500000)
                .claimed(claimed)
                .claimable(claimable)
                .build();
    }

    @Override
    public WelcomeVoucherResponse claimVoucher(User user) {
        if (user == null) {
            return null;
        }

        // Đã claim rồi thì không cho claim lại
        if (Boolean.TRUE.equals(user.getWelcomeVoucherClaimed())) {
            return null;
        }

        // Cập nhật flag cho user
        user.setWelcomeVoucherClaimed(true);
        userRepository.save(user);

        // Tăng usedCount trong promotion
        promotionRepository.findByCodeIgnoreCase(WELCOME_CODE).ifPresent(promo -> {
            promo.setUsedCount(promo.getUsedCount() + 1);
            promotionRepository.save(promo);
        });

        log.info("User {} claimed welcome voucher WELCOME500K", user.getEmail());

        return WelcomeVoucherResponse.builder()
                .hasVoucher(true)
                .code(WELCOME_CODE)
                .name("Voucher 500K cho chuyến đi đầu tiên")
                .discountValue(500000)
                .minOrderAmount(500000)
                .claimed(true)
                .claimable(false)
                .build();
    }
}
