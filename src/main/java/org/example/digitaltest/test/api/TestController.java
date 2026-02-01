package org.example.digitaltest.test.api;

import org.example.digitaltest.question.api.dto.QuestionDTO;
import org.example.digitaltest.test.api.dto.TestDTO;
import org.example.digitaltest.test.domain.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestService testService;

    @Autowired
    public TestController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping
    public ResponseEntity<List<TestDTO>> getTests() {
        return ResponseEntity.ok(testService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestDTO> getTest(@PathVariable Long id) {
        return ResponseEntity.ok(testService.findDtoByIdWithQuestion(id));
    }

    @GetMapping("/{testId}/questions/next")
    public ResponseEntity<QuestionDTO> nextQuestion(@RequestParam Integer currentIndexQuestion,
                                                    @PathVariable Long testId) {
        return ResponseEntity.ok(testService.findDtoById(testId).questions().get(currentIndexQuestion + 1));
    }

    @GetMapping("/{testId}/questions/back")
    public ResponseEntity<QuestionDTO> backQuestion(@RequestParam Integer currentIndexQuestion,
                                                    @PathVariable Long testId) {
        return ResponseEntity.ok(testService.findDtoById(testId).questions().get(currentIndexQuestion - 1));
    }
}
