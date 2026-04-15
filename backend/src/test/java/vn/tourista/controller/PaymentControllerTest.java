package vn.tourista.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.tourista.dto.request.CreateVnpayPaymentRequest;
import vn.tourista.dto.response.CreateVnpayPaymentResponse;
import vn.tourista.dto.response.VnpayReturnResponse;
import vn.tourista.exception.GlobalExceptionHandler;
import vn.tourista.service.VnpayService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private VnpayService vnpayService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        PaymentController controller = new PaymentController(vnpayService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createVnpayPayment_ShouldReturn201_WhenRequestIsValid() throws Exception {
        CreateVnpayPaymentResponse response = CreateVnpayPaymentResponse.builder()
                .bookingCode("TRS-12345")
                .paymentUrl("https://sandbox.vnpayment.vn/pay")
                .provider("VNPAY")
                .build();

        when(vnpayService.createPaymentUrl(eq("traveler@example.com"), eq("198.51.100.7"),
                any(CreateVnpayPaymentRequest.class))).thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("traveler@example.com",
                "N/A");

        mockMvc.perform(post("/api/payments/vnpay/create")
                .principal(auth)
                .header("X-Forwarded-For", "198.51.100.7")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"bookingCode\":\"TRS-12345\"," +
                        "\"returnUrl\":\"http://localhost:3000/payments/success\"" +
                        "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentUrl").value("https://sandbox.vnpayment.vn/pay"));

        ArgumentCaptor<CreateVnpayPaymentRequest> requestCaptor = ArgumentCaptor
                .forClass(CreateVnpayPaymentRequest.class);
        verify(vnpayService).createPaymentUrl(eq("traveler@example.com"), eq("198.51.100.7"), requestCaptor.capture());
        assertEquals("TRS-12345", requestCaptor.getValue().getBookingCode());
    }

    @Test
    void createVnpayPayment_ShouldReturn422_WhenBookingCodeIsMissing() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("traveler@example.com",
                "N/A");

        mockMvc.perform(post("/api/payments/vnpay/create")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"bookingCode\":\"\"" +
                        "}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.bookingCode").exists());
    }

    @Test
    void vnpayReturn_ShouldReturn200_WhenServiceParsesCallback() throws Exception {
        VnpayReturnResponse response = VnpayReturnResponse.builder()
                .validSignature(true)
                .success(true)
                .bookingCode("TRS-12345")
                .responseCode("00")
                .build();

        when(vnpayService.parseReturn(anyMap())).thenReturn(response);

        mockMvc.perform(get("/api/payments/vnpay/return")
                .param("vnp_TxnRef", "TRS-12345")
                .param("vnp_ResponseCode", "00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.bookingCode").value("TRS-12345"));
    }
}
