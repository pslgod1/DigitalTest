package org.example.digitaltest.test.api.dto;

import org.example.digitaltest.question.api.dto.CreateQuestionDto;

import java.util.Set;

public record CreateTestDto(
        Set<CreateQuestionDto> questions,
        String title,
        String description,
        Integer timeLimitMinutes
) {
}
