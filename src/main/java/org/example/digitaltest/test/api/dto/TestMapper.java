package org.example.digitaltest.test.api.dto;

import org.example.digitaltest.question.api.dto.QuestionDTO;
import org.example.digitaltest.question.api.dto.QuestionMapper;
import org.example.digitaltest.test.db.TestEntity;
import org.example.digitaltest.user.api.dto.UserDTO;
import org.example.digitaltest.user.api.dto.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TestMapper {

    private final QuestionMapper questionMapper;
    private final UserMapper userMapper;

    @Autowired
    public TestMapper(@Lazy QuestionMapper questionMapper,@Lazy UserMapper userMapper) {
        this.questionMapper = questionMapper;
        this.userMapper = userMapper;
    }

    public TestEntity convertCreateDtoToEntity(CreateTestDto dto){
        TestEntity testEntity = new TestEntity();
        testEntity.setQuestions(questionMapper.convertCreateDtoToEntitySet(dto.questions()));
        testEntity.setTitle(dto.title());
        testEntity.setDescription(dto.description());
        testEntity.setTimeLimitMinutes(dto.timeLimitMinutes());
        return testEntity;
    }



    public TestDTO convertEntityToDTO(TestEntity entity) {
        if (entity == null) {
            return null;
        }

        UserDTO admin = null;
        if (entity.getAdmin() != null) {
            admin = userMapper.convertEntityToDto(entity.getAdmin());
        }

        List<QuestionDTO> questionDTOs = new ArrayList<>();
        if (entity.getQuestions() != null) {
            questionDTOs = questionMapper.convertEntityToQuestionDtoLists(entity.getQuestions());
        }

        return new TestDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getTimeLimitMinutes(),
                entity.getCreatedAt(),
                questionDTOs,
                admin
        );
    }




    public List<TestDTO> convertEntityToListDTO(List<TestEntity> entityList){
        return entityList
                .stream()
                .map(this::convertEntityToDTO)
                .collect(Collectors.toList());
    }

}
