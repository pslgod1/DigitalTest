package org.example.digitaltest.userAnswer.api.dto;

public record UserCreateAnswer(
        long userTestId,
        long questionId,
        int selectedAnswerIndex
) {
}
