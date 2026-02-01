package org.example.digitaltest.question.api.dto;

import org.example.digitaltest.question.db.Type;

import java.util.List;

public record QuestionDTO(
        Long id,
        String question,
        List<String> answers,
        Integer correctAnswerIndex,
        Type type
) {
}
