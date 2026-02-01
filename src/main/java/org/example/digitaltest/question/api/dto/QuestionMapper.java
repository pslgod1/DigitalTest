package org.example.digitaltest.question.api.dto;

import org.example.digitaltest.question.db.QuestionEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class QuestionMapper {


    public QuestionEntity convertDtoToEntity(CreateQuestionDto dto){
        QuestionEntity questionEntity = new QuestionEntity();
        questionEntity.setQuestion(dto.question());
        questionEntity.setAnswer(dto.answerOptions());
        questionEntity.setCorrectAnswerIndex(dto.correctAnswerIndex());
        questionEntity.setType(dto.type());
        return questionEntity;
    }

    public QuestionEntity convertDtoToEntity(QuestionDTO dto){
        QuestionEntity questionEntity = new QuestionEntity();
        questionEntity.setQuestion(dto.question());
        questionEntity.setAnswer(dto.answers());
        questionEntity.setCorrectAnswerIndex(dto.correctAnswerIndex());
        questionEntity.setType(dto.type());
        return questionEntity;
    }


    public QuestionDTO convertEntityToQuestionDto(QuestionEntity entity){
        return new QuestionDTO(
                entity.getId(),
                entity.getQuestion(),
                entity.getAnswer(),
                entity.getCorrectAnswerIndex(),
                entity.getType()
        );
    }

    public Set<QuestionEntity> convertCreateDtoToEntitySet(Set<CreateQuestionDto> dto){
        Set<QuestionEntity> questionEntitySet = new HashSet<>();
        for (CreateQuestionDto dto1 : dto) {
            questionEntitySet.add(convertDtoToEntity(dto1));
        }
        return questionEntitySet;
    }

    public List<QuestionDTO> convertEntityToQuestionDtoLists(Set<QuestionEntity> entities){
        List<QuestionDTO> questionDtoList = new ArrayList<>();
        for (QuestionEntity dto1 : entities) {
            questionDtoList.add(convertEntityToQuestionDto(dto1));
        }
        return questionDtoList;
    }

    public Set<QuestionEntity> convertDtoToEntitySet(List<QuestionDTO> dto){
        Set<QuestionEntity> questionEntitySet = new HashSet<>();
        for (QuestionDTO dto1 : dto) {
            questionEntitySet.add(convertDtoToEntity(dto1));
        }
        return questionEntitySet;
    }

}
