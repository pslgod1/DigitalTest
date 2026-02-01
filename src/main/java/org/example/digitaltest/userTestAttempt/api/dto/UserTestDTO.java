package org.example.digitaltest.userTestAttempt.api.dto;

import org.example.digitaltest.test.api.dto.TestDTO;
import org.example.digitaltest.user.api.dto.UserDTO;
import org.example.digitaltest.userAnswer.api.dto.UserAnswerDTO;

import java.time.LocalDateTime;
import java.util.Set;

public record UserTestDTO(
    Long id,
    UserDTO user,
    TestDTO test,
    LocalDateTime startAt,
    LocalDateTime completedAt,
    Double percentage,
    Set<UserAnswerDTO> answers
) {
}
