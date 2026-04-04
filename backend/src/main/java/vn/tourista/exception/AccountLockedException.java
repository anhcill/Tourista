package vn.tourista.exception;

import java.time.LocalDateTime;

// 423 - Tài khoản bị khóa do đăng nhập sai quá nhiều lần
public class AccountLockedException extends RuntimeException {

    private final LocalDateTime lockedUntil;

    public AccountLockedException(String message, LocalDateTime lockedUntil) {
        super(message);
        this.lockedUntil = lockedUntil;
    }

    public LocalDateTime getLockedUntil() {
        return lockedUntil;
    }
}
