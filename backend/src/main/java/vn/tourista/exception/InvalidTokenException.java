package vn.tourista.exception;

// 401 - Refresh token không hợp lệ hoặc đã bị thu hồi hoặc hết hạn
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
