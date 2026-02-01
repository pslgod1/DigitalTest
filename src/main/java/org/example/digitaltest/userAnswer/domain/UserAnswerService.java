package org.example.digitaltest.userAnswer.domain;

import org.example.digitaltest.question.db.QuestionEntity;
import org.example.digitaltest.question.domain.QuestionService;
import org.example.digitaltest.userAnswer.api.dto.UserAnswerDTO;
import org.example.digitaltest.userAnswer.api.dto.UserAnswerMapper;
import org.example.digitaltest.userAnswer.api.dto.UserCreateAnswer;
import org.example.digitaltest.userAnswer.db.UserAnswerEntity;
import org.example.digitaltest.userAnswer.db.UserAnswerRepository;
import org.example.digitaltest.userTestAttempt.domain.UserTestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserAnswerService {
    private final UserAnswerRepository userAnswerRepository;
    private final UserTestService userTestService;
    private final QuestionService questionService;
    private final UserAnswerMapper userAnswerMapper;

    @Autowired
    public UserAnswerService(UserAnswerRepository userAnswerRepository, UserTestService userTestService,
                             QuestionService questionService, UserAnswerMapper userAnswerMapper) {
        this.userAnswerRepository = userAnswerRepository;
        this.userTestService = userTestService;
        this.questionService = questionService;
        this.userAnswerMapper = userAnswerMapper;
    }

    //========================================Controller===========================================================

    public UserAnswerDTO userGaveAnswer(UserCreateAnswer userAnswerDTO) {
        UserAnswerEntity savedUserAnswerEntity = new UserAnswerEntity();
        QuestionEntity questionEntity = questionService.findById(userAnswerDTO.questionId());

        savedUserAnswerEntity.setTestAttempt(userTestService.findById(userAnswerDTO.userTestId()));
        savedUserAnswerEntity.setQuestion(questionEntity);
        savedUserAnswerEntity.setSelectedAnswerIndex(userAnswerDTO.selectedAnswerIndex());
        savedUserAnswerEntity.setIsCorrect(correctAnswer(questionEntity,userAnswerDTO.selectedAnswerIndex()));
        savedUserAnswerEntity.setAnsweredAt(LocalDateTime.now());

        userTestService.changePercentage(userAnswerDTO.userTestId(),userAnswerDTO.selectedAnswerIndex(),questionEntity.getCorrectAnswerIndex());

        return userAnswerMapper.convertEntityToDto(userAnswerRepository.save(savedUserAnswerEntity));
    }

    //========================================Service===========================================================

    private boolean correctAnswer(QuestionEntity question,Integer selectedAnswerIndex) {
        if(selectedAnswerIndex==null) {
            return false;
        }
        return selectedAnswerIndex.equals(question.getCorrectAnswerIndex());
    }
}
