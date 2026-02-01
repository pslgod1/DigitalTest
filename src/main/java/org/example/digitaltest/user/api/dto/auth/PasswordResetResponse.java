package org.example.digitaltest.user.api.dto.auth;

public record PasswordResetResponse(
        boolean success,
        String message,
        String resetId
){
}
