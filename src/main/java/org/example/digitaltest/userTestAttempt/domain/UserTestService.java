package org.example.digitaltest.userTestAttempt.domain;

import lombok.extern.slf4j.Slf4j;
import org.example.digitaltest.test.domain.TestService;
import org.example.digitaltest.user.domain.UserService;
import org.example.digitaltest.userTestAttempt.api.dto.UserTestDTO;
import org.example.digitaltest.userTestAttempt.api.dto.UserTestMapper;
import org.example.digitaltest.userTestAttempt.db.UserTestAttemptEntity;
import org.example.digitaltest.userTestAttempt.db.UserTestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@Transactional
public class UserTestService {

    private final UserTestRepository userTestRepository;
    private final UserService userService;
    private final TestService testService;
    private final UserTestMapper userTestMapper;

    @Autowired
    public UserTestService(UserTestRepository userTestRepository, UserService userService,
                           TestService testService, UserTestMapper userTestMapper) {
        this.userTestRepository = userTestRepository;
        this.userService = userService;
        this.testService = testService;
        this.userTestMapper = userTestMapper;
    }

    //========================================Controller===========================================================

    @Transactional(readOnly = true)
    public List<UserTestDTO> findAllByUser() {
        try {
            var currentUser = userService.findCurrentUser();
            if (currentUser == null) {
                return Collections.emptyList();
            }

            List<UserTestAttemptEntity> attempts;
            try {
                attempts = userTestRepository.findAllByUserIdWithTest(currentUser.getId());
            } catch (Exception e) {
                attempts = userTestRepository.findAllByUserId(currentUser.getId());
            }


            return userTestMapper.convertEntityToDTOList(attempts);

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch user test attempts", e);
        }
    }

    @Transactional(readOnly = true)
    public UserTestDTO findDtoById(Long id) {
        try {
            UserTestAttemptEntity entity = userTestRepository.findByIdWithUserAndTest(id);
            if (entity == null) {
                throw new NoSuchElementException("User test attempt not found with id: " + id);
            }

            return userTestMapper.convertEntityToDTO(entity);
        } catch (Exception e) {
            throw new RuntimeException( e);
        }
    }

    public UserTestDTO assignUser(Long testId) {
        try {
            var currentUser = userService.findCurrentUser();
            if (currentUser == null) {
                throw new IllegalStateException("User not authenticated");
            }


            var test = testService.findByIdWithQuestion(testId);
            if (test == null) {
                throw new NoSuchElementException("Test not found with id: " + testId);
            }


            UserTestAttemptEntity assignEntity = new UserTestAttemptEntity();
            assignEntity.setUser(currentUser);
            assignEntity.setTest(test);
            assignEntity.setStartedAt(LocalDateTime.now());
            assignEntity.setPercentage(0.0);
            assignEntity.setCompletedAt(null);

            UserTestAttemptEntity saved = userTestRepository.save(assignEntity);

            return userTestMapper.convertEntityToDTO(saved);

        } catch (Exception e) {
            throw new RuntimeException("Failed to assign test to user", e);
        }
    }


    @Transactional
    public UserTestDTO completed(Long userTestId) {
        try {
            UserTestAttemptEntity completeEntity = findById(userTestId);
            completeEntity.setCompletedAt(LocalDateTime.now());

            UserTestAttemptEntity saved = userTestRepository.save(completeEntity);

            return userTestMapper.convertEntityToDTO(saved);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    //========================================Service===========================================================

    @Transactional(readOnly = true)
    public UserTestAttemptEntity findById(Long id) {
        return userTestRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User test attempt not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<UserTestAttemptEntity> findAllByTestId(Long testId) {
        return userTestRepository.findAllByTestId(testId);
    }

    @Transactional
    public void changePercentage(long userTestId, int selectedIndex, int questionIndex) {
        try {
            UserTestAttemptEntity changeEntity = findById(userTestId);

            if (changeEntity.getTest() == null) {
                throw new NoSuchElementException();
            }
            if(selectedIndex == questionIndex) {
                double percentage = changeEntity.getPercentage() != null ?
                        changeEntity.getPercentage() : 0.0;

                double coff = (double) 100 / changeEntity.getTest().getQuestions().size();

                percentage += coff;
                changeEntity.setPercentage(percentage);
                userTestRepository.save(changeEntity);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private boolean assignValidate() {
        try {
            List<UserTestDTO> tests = findAllByUser();
            for (UserTestDTO testEntity : tests) {
                if (testEntity.completedAt() == null) {
                    return false; // Есть незавершенный тест
                }
            }
            return true; // Все тесты завершены
        } catch (Exception e) {
            log.error("Error in assignValidate: {}", e.getMessage());
            return false;
        }
    }
}