package vn.tourista.exception;

// 403 - Tài khoản chưa xác thực email
public class EmailNotVerifiedException extends RuntimeException {
    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
