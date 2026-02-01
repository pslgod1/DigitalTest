package org.example.digitaltest.user.api.dto.auth;


public record RegistrationResponse(
        boolean success,
        String message,
        String registrationId
) {
}
