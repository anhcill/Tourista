package vn.tourista.service;

import vn.tourista.dto.request.CreateVnpayPaymentRequest;
import vn.tourista.dto.response.CreateVnpayPaymentResponse;
import vn.tourista.dto.response.VnpayReturnResponse;

import java.util.Map;

public interface VnpayService {

    CreateVnpayPaymentResponse createPaymentUrl(String userEmail, String clientIp, CreateVnpayPaymentRequest request);

    Map<String, String> handleIpn(Map<String, String> vnpParams);

    VnpayReturnResponse parseReturn(Map<String, String> vnpParams);
}
