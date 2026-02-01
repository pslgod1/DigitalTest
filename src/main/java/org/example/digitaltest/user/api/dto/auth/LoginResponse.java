package org.example.digitaltest.user.api.dto.auth;

public record LoginResponse(
        boolean success,
        String message,
        String redirectUrl
) {
}
