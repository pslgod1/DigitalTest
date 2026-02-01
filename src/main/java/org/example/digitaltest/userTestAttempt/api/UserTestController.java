package org.example.digitaltest.userTestAttempt.api;

import org.example.digitaltest.userTestAttempt.api.dto.UserTestDTO;
import org.example.digitaltest.userTestAttempt.domain.UserTestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-test")
public class UserTestController {

    private final UserTestService userTestService;

    public UserTestController(UserTestService userTestService) {
        this.userTestService = userTestService;
    }

    @GetMapping
    public ResponseEntity<List<UserTestDTO>> findAllByUserId() {
        return ResponseEntity.ok(userTestService.findAllByUser());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserTestDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userTestService.findDtoById(id));
    }

    @PostMapping("/{id}/completed")
    public ResponseEntity<UserTestDTO> completed(@PathVariable Long id) {
        return ResponseEntity.ok(userTestService.completed(id));
    }

    @PostMapping("/{testId}")
    public ResponseEntity<UserTestDTO> createUserTestAttempt(@PathVariable Long testId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userTestService.assignUser(testId));
    }
}