package vn.tourista.exception;

// 409 - Email đã đăng ký rồi
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
