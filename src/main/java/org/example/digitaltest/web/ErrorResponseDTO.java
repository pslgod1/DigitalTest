package org.example.digitaltest.web;

import java.time.LocalDateTime;

public record ErrorResponseDTO(
        String message,
        String errorMessage,
        LocalDateTime errorTime
) {
}
