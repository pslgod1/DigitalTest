package org.example.digitaltest.user.api.dto;

import org.example.digitaltest.user.db.Role;

import java.time.LocalDateTime;

public record UserDTO(
    Long id,
    String name,
    String email,
    String password,
    LocalDateTime createAt,
    Role role
) {
}
