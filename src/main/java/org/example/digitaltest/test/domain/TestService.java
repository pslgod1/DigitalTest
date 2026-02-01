package org.example.digitaltest.test.domain;


import org.example.digitaltest.test.api.dto.TestDTO;
import org.example.digitaltest.test.api.dto.TestMapper;
import org.example.digitaltest.test.db.TestEntity;
import org.example.digitaltest.test.db.TestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TestService {
    private final TestRepository testRepository;
    private final TestMapper testMapper;

    @Autowired
    public TestService(TestRepository testRepository,
                       TestMapper testMapper) {
        this.testRepository = testRepository;
        this.testMapper = testMapper;
    }

    //========================================Controller===========================================================

    @Transactional
    public List<TestDTO> findAll() {
        List<TestEntity> test = testRepository.findAll();
        return testMapper.convertEntityToListDTO(test);
    }

    public TestDTO findDtoById(Long id) {
        return testMapper.convertEntityToDTO(findById(id));
    }

    @Transactional(readOnly = true)
    public TestDTO findDtoByIdWithQuestion(Long id) {
        TestEntity test = testRepository.findByIdWithQuestions(id);

        return testMapper.convertEntityToDTO(test);
    }

    //========================================Service===========================================================

    public TestEntity findById(Long id) {
        return testRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Not found test with id: " + id));
    }

    public TestEntity findByIdWithQuestion(Long id) {
        return testRepository.findByIdWithQuestions(id);
    }

    public TestEntity save(TestEntity testEntity) {
        return testRepository.save(testEntity);
    }


    public void delete(Long id) {
        testRepository.deleteById(id);
    }
}
