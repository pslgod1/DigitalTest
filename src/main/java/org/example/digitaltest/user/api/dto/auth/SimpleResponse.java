package org.example.digitaltest.user.api.dto.auth;

public record SimpleResponse(
        boolean success,
        String message
) {
}
