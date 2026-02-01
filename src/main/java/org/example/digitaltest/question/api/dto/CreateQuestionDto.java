package org.example.digitaltest.question.api.dto;

import org.example.digitaltest.question.db.Type;

import java.util.List;

public record CreateQuestionDto(
     String question,
     List<String> answerOptions,
     Integer correctAnswerIndex,
     Type type
){
}
