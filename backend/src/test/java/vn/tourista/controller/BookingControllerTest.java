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
import vn.tourista.dto.request.CreateTourBookingRequest;
import vn.tourista.dto.response.CreateTourBookingResponse;
import vn.tourista.exception.GlobalExceptionHandler;
import vn.tourista.service.BookingService;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        BookingController controller = new BookingController();
        ReflectionTestUtils.setField(controller, "bookingService", bookingService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createTourBooking_ShouldReturn201_WhenRequestIsValid() throws Exception {
        CreateTourBookingResponse response = CreateTourBookingResponse.builder()
                .bookingId(1L)
                .bookingCode("TRS-12345")
                .status("PENDING")
                .totalAmount(new BigDecimal("2590000"))
                .build();

        when(bookingService.createTourBooking(eq("traveler@example.com"), any(CreateTourBookingRequest.class)))
                .thenReturn(response);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("traveler@example.com",
                "N/A");

        mockMvc.perform(post("/api/bookings/tours")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"tourId\":11," +
                        "\"departureId\":101," +
                        "\"adults\":2," +
                        "\"children\":1" +
                        "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.bookingCode").value("TRS-12345"));

        ArgumentCaptor<CreateTourBookingRequest> requestCaptor = ArgumentCaptor
                .forClass(CreateTourBookingRequest.class);
        verify(bookingService).createTourBooking(eq("traveler@example.com"), requestCaptor.capture());
        assertEquals(11L, requestCaptor.getValue().getTourId());
    }

    @Test
    void createTourBooking_ShouldReturn422_WhenValidationFails() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("traveler@example.com",
                "N/A");

        mockMvc.perform(post("/api/bookings/tours")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"tourId\":11," +
                        "\"departureId\":101," +
                        "\"adults\":0," +
                        "\"children\":0" +
                        "}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.adults").exists());
    }

    @Test
    void createTourBooking_ShouldReturn400_WhenServiceRejectsBusinessRule() throws Exception {
        when(bookingService.createTourBooking(eq("traveler@example.com"), any(CreateTourBookingRequest.class)))
                .thenThrow(new IllegalArgumentException("Not enough slots"));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("traveler@example.com",
                "N/A");

        mockMvc.perform(post("/api/bookings/tours")
                .principal(auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"tourId\":11," +
                        "\"departureId\":101," +
                        "\"adults\":2," +
                        "\"children\":0" +
                        "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
