package vn.tourista.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.validation.FieldError;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.tourista.dto.response.ApiResponse;

import java.net.SocketException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

// Bắt toàn bộ exception và trả về JSON chuẩn cho client
// Controller KHÔNG cần try/catch — cứ để exception nổi lên đây xử lý
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Validation lỗi (@Valid trong controller) → 422
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = ((FieldError) err).getField();
            String message = err.getDefaultMessage();
            errors.put(field, message);
        });
        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY) // 422
                .body(ApiResponse.failWithErrors("Dữ liệu không hợp lệ", errors));
    }

    // Email đã đăng ký → 409
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleEmailExists(EmailAlreadyExistsException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Sai email/mật khẩu → 401
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Tài khoản bị khóa → 423
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccountLocked(AccountLockedException ex) {
        Map<String, String> errors = new HashMap<>();
        errors.put("lockedUntil", ex.getLockedUntil().toString());
        return ResponseEntity
                .status(HttpStatus.LOCKED)
                .body(ApiResponse.failWithErrors(ex.getMessage(), errors));
    }

    // Chưa verify email → 403
    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ApiResponse<?>> handleEmailNotVerified(EmailNotVerifiedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Token không hợp lệ / hết hạn → 401
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidToken(InvalidTokenException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Request không hợp lệ → 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Không tìm thấy dữ liệu → 404
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Resource not found → 404
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Unauthorized → 401
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<?>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.fail(ex.getMessage()));
    }

    // Vi phạm ràng buộc DB (duplicate key, FK...) → 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.fail("Du lieu xung dot hoac vi pham rang buoc"));
    }

    // Client đóng kết nối giữa chừng (refresh/đóng tab/hủy request) — không phải
    // lỗi nghiệp vụ.
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleAsyncDisconnect(AsyncRequestNotUsableException ex) {
        log.debug("Client disconnected during async response: {}", ex.getMessage());
    }

    // Mọi exception không xác định → 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        if (isClientDisconnect(ex)) {
            log.debug("Client disconnected while server was writing response: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        log.error("Unhandled exception", ex);
        String detail = ex.getClass().getName() + ": " + ex.getMessage();
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("Lỗi hệ thống, vui lòng thử lại sau [DEBUG: " + detail + "]"));
    }

    private boolean isClientDisconnect(Throwable ex) {
        Throwable cursor = ex;
        while (cursor != null) {
            String className = cursor.getClass().getName();
            if (className.contains("ClientAbortException") || className.contains("AsyncRequestNotUsableException")) {
                return true;
            }

            if (cursor instanceof SocketException socketException) {
                String msg = String.valueOf(socketException.getMessage()).toLowerCase(Locale.ROOT);
                if (msg.contains("broken pipe")
                        || msg.contains("connection reset")
                        || msg.contains("connection aborted")
                        || msg.contains("forcibly closed")
                        || msg.contains("software in your host machine")) {
                    return true;
                }
            }
            cursor = cursor.getCause();
        }
        return false;
    }
}
