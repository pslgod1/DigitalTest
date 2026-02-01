package org.example.digitaltest.userAnswer.api.dto;

import org.example.digitaltest.question.api.dto.QuestionDTO;

import java.time.LocalDateTime;

public record UserAnswerDTO(
    Long id,
    QuestionDTO questionDTO,
    Integer selectedAnswerIndex,
    Boolean isCorrect,
    LocalDateTime answerAt
) {
}
