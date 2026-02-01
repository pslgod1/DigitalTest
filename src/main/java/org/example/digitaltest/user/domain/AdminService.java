package org.example.digitaltest.user.domain;

import org.example.digitaltest.question.api.dto.QuestionMapper;
import org.example.digitaltest.question.db.QuestionEntity;
import org.example.digitaltest.question.domain.QuestionService;
import org.example.digitaltest.test.api.dto.CreateTestDto;
import org.example.digitaltest.test.api.dto.TestDTO;
import org.example.digitaltest.test.api.dto.TestMapper;
import org.example.digitaltest.test.db.TestEntity;
import org.example.digitaltest.test.domain.TestService;
import org.example.digitaltest.user.api.dto.UserDTO;
import org.example.digitaltest.user.api.dto.UserMapper;
import org.example.digitaltest.user.db.Role;
import org.example.digitaltest.user.db.UserEntity;
import org.example.digitaltest.userTestAttempt.api.dto.UserTestDTO;
import org.example.digitaltest.userTestAttempt.api.dto.UserTestMapper;
import org.example.digitaltest.userTestAttempt.domain.UserTestService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class AdminService {
    private final UserService userService;
    private final QuestionService questionService;
    private final TestService testService;
    private final TestMapper testMapper;
    private final QuestionMapper questionMapper;
    private final UserTestService userTestService;
    private final UserTestMapper userTestMapper;
    private final UserMapper userMapper;

    public AdminService(UserService userService, QuestionService questionService, TestService testService, TestMapper testMapper, QuestionMapper questionMapper, UserTestService userTestService, UserTestMapper userTestMapper, UserMapper userMapper) {
        this.userService = userService;
        this.questionService = questionService;
        this.testService = testService;
        this.testMapper = testMapper;
        this.questionMapper = questionMapper;
        this.userTestService = userTestService;
        this.userTestMapper = userTestMapper;
        this.userMapper = userMapper;
    }

    //========================================Controller===========================================================

    public List<UserTestDTO> getUserTests(Long testId){
        return userTestMapper.convertEntityToDTOList(userTestService.findAllByTestId(testId));
    }

    public UserTestDTO getUserTest(Long userTestId) {
        return  userTestMapper.convertEntityToDTO(userTestService.findById(userTestId));
    }

    public List<UserDTO> findAllAdmin() {
        return userMapper.convertEntityListToDTOList(userService.findAllByRole(Role.ADMIN));
    }

    public UserDTO giveAdmin(String email) {
        UserEntity user = userService.findByEmail(email);
        user.setRole(Role.ADMIN);
        return userMapper.convertEntityToDto(userService.save(user));
    }

    public TestDTO createTest(CreateTestDto testDto) {//Поменять
        try {
            TestEntity testEntity = testMapper.convertCreateDtoToEntity(testDto);
            testEntity.setAdmin(userService.findCurrentUser());
            testEntity.setCreatedAt(LocalDateTime.now());

            TestEntity savedTest = testService.save(testEntity);

            Set<QuestionEntity> questionSet = questionMapper.convertCreateDtoToEntitySet(testDto.questions());
            for (QuestionEntity question : questionSet) {
                question.setTest(savedTest);
                questionService.save(question);
            }

            return testMapper.convertEntityToDTO(testService.save(savedTest));
        }catch (Exception e) {
            throw new RuntimeException("Error saving test", e);
        }
    }

    public void deletedTest(Long testId) {
        try {
            testService.delete(testId);
        }catch (Exception e) {
            throw new RuntimeException("Error deleting test", e);
        }
    }

}
