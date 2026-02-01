package org.example.digitaltest.userTestAttempt.api.dto;

import lombok.extern.slf4j.Slf4j;
import org.example.digitaltest.test.api.dto.TestDTO;
import org.example.digitaltest.test.api.dto.TestMapper;
import org.example.digitaltest.user.api.dto.UserDTO;
import org.example.digitaltest.user.api.dto.UserMapper;
import org.example.digitaltest.userAnswer.api.dto.UserAnswerMapper;
import org.example.digitaltest.userTestAttempt.db.UserTestAttemptEntity;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;


@Component
public class UserTestMapper {

    private final UserMapper userMapper;
    private final TestMapper testMapper;
    private final UserAnswerMapper userAnswerMapper;

    public UserTestMapper(@Lazy UserMapper userMapper,@Lazy TestMapper testMapper,@Lazy UserAnswerMapper userAnswerMapper) {
        this.userMapper = userMapper;
        this.testMapper = testMapper;
        this.userAnswerMapper = userAnswerMapper;
    }

    public UserTestDTO convertEntityToDTO(UserTestAttemptEntity entity) {
        UserDTO userDto = userMapper.convertEntityToDto(entity.getUser());
        TestDTO testDto = testMapper.convertEntityToDTO(entity.getTest());
        return new UserTestDTO(
                entity.getId(),
                userDto,
                testDto,
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getPercentage(),
                userAnswerMapper.convertDtoToEntity(entity.getUserAnswers())
        );
    }




    public List<UserTestDTO> convertEntityToDTOList(List<UserTestAttemptEntity> entityList) {
        List<UserTestDTO> dtoList = new ArrayList<>();
        for (UserTestAttemptEntity entity : entityList) {
            dtoList.add(convertEntityToDTO(entity));
        }
        return dtoList;
    }
}
