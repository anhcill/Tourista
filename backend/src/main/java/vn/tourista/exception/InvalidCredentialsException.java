package vn.tourista.exception;

// 401 - Sai email hoặc mật khẩu
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
