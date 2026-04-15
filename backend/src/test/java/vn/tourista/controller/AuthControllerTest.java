package vn.tourista.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import vn.tourista.dto.request.LoginRequest;
import vn.tourista.dto.response.AuthResponse;
import vn.tourista.exception.GlobalExceptionHandler;
import vn.tourista.exception.InvalidCredentialsException;
import vn.tourista.security.OAuth2LoginCodeStore;
import vn.tourista.service.AuthService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private OAuth2LoginCodeStore oAuth2LoginCodeStore;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AuthController controller = new AuthController();
        ReflectionTestUtils.setField(controller, "authService", authService);
        ReflectionTestUtils.setField(controller, "oAuth2LoginCodeStore", oAuth2LoginCodeStore);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void login_ShouldReturn200_WhenCredentialsAreValid() throws Exception {
        AuthResponse response = AuthResponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .expiresIn(3600)
                .build();

        when(authService.login(any(LoginRequest.class), eq("10.1.2.3"), eq("JUnit-Agent")))
                .thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Forwarded-For", "10.1.2.3, 10.1.2.4")
                .header("User-Agent", "JUnit-Agent")
                .content("{" +
                        "\"email\":\"test@example.com\"," +
                        "\"password\":\"Secret123!\"" +
                        "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));

        ArgumentCaptor<LoginRequest> requestCaptor = ArgumentCaptor.forClass(LoginRequest.class);
        verify(authService).login(requestCaptor.capture(), eq("10.1.2.3"), eq("JUnit-Agent"));
        assertEquals("test@example.com", requestCaptor.getValue().getEmail());
    }

    @Test
    void login_ShouldReturn422_WhenPayloadIsInvalid() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" +
                        "\"email\":\"invalid-email\"," +
                        "\"password\":\"\"" +
                        "}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void login_ShouldReturn401_WhenServiceThrowsInvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class), anyString(), anyString()))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Forwarded-For", "203.0.113.1")
                .header("User-Agent", "JUnit-Agent")
                .content("{" +
                        "\"email\":\"test@example.com\"," +
                        "\"password\":\"WrongPassword\"" +
                        "}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
