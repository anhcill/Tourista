package vn.tourista.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WelcomeVoucherResponse {

    /** Có voucher hay không */
    private boolean hasVoucher;

    /** Mã voucher */
    private String code;

    /** Tên voucher */
    private String name;

    /** Giá trị giảm (VND) */
    private Integer discountValue;

    /** Đơn hàng tối thiểu */
    private Integer minOrderAmount;

    /** Đã được claim chưa (chỉ khi user đã login) */
    private Boolean claimed;

    /** Có thể claim được không */
    private Boolean claimable;
}
