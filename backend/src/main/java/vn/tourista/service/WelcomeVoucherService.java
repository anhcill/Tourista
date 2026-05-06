package vn.tourista.service;

import vn.tourista.dto.response.WelcomeVoucherResponse;
import vn.tourista.entity.User;

public interface WelcomeVoucherService {
    /**
     * Lấy thông tin welcome voucher.
     * @param user User hiện tại (null nếu chưa login)
     * @return WelcomeVoucherResponse chứa thông tin hiển thị
     */
    WelcomeVoucherResponse getWelcomeVoucher(User user);

    /**
     * Claim voucher về tài khoản user.
     * @param user User đã login
     * @return WelcomeVoucherResponse đã claimed, hoặc null nếu đã claim rồi
     */
    WelcomeVoucherResponse claimVoucher(User user);
}
