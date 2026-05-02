package vn.tourista.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.tourista.dto.request.admin.AdminBookingStatusUpdateRequest;
import vn.tourista.dto.response.admin.AdminBookingItemResponse;
import vn.tourista.exception.GlobalExceptionHandler;
import vn.tourista.service.AdminService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AdminController controller = new AdminController(adminService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void updateBookingStatus_ShouldReturn200_WhenRequestIsValid() throws Exception {
        AdminBookingItemResponse response = AdminBookingItemResponse.builder()
                .id(99L)
                .bookingCode("TRS-99999")
                .status("CONFIRMED")
                .paymentStatus("PAID")
                .totalAmount(new BigDecimal("3500000"))
                .currency("VND")
                .createdAt(LocalDateTime.now())
                .build();

        when(adminService.updateBookingStatus(eq(99L), any(AdminBookingStatusUpdateRequest.class),
                eq("admin@tourista.vn"))).thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("admin@tourista.vn", "N/A");

        mockMvc.perform(patch("/api/admin/bookings/99/status")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"status\":\"CONFIRMED\"," +
                        "\"reason\":\"Payment verified\"" +
                        "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        ArgumentCaptor<AdminBookingStatusUpdateRequest> requestCaptor = ArgumentCaptor
                .forClass(AdminBookingStatusUpdateRequest.class);
        verify(adminService).updateBookingStatus(eq(99L), requestCaptor.capture(), eq("admin@tourista.vn"));
        assertEquals("CONFIRMED", requestCaptor.getValue().getStatus());
    }

    @Test
    void updateBookingStatus_ShouldReturn422_WhenReasonIsMissing() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("admin@tourista.vn", "N/A");

        mockMvc.perform(patch("/api/admin/bookings/99/status")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"status\":\"CONFIRMED\"," +
                        "\"reason\":\"\"" +
                        "}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.reason").exists());
    }

    @Test
    void updateBookingStatus_ShouldReturn404_WhenBookingDoesNotExist() throws Exception {
        when(adminService.updateBookingStatus(eq(99L), any(AdminBookingStatusUpdateRequest.class),
                eq("admin@tourista.vn"))).thenThrow(new NoSuchElementException("Booking not found"));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("admin@tourista.vn", "N/A");

        mockMvc.perform(patch("/api/admin/bookings/99/status")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"status\":\"CONFIRMED\"," +
                        "\"reason\":\"Payment verified\"" +
                        "}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
