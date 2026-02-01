package org.example.digitaltest.user.api;

import org.example.digitaltest.test.api.dto.CreateTestDto;
import org.example.digitaltest.test.api.dto.TestDTO;
import org.example.digitaltest.user.api.dto.UserDTO;
import org.example.digitaltest.user.domain.AdminService;
import org.example.digitaltest.userTestAttempt.api.dto.UserTestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO> >findAll() {
        return ResponseEntity.ok(adminService.findAllAdmin());
    }

    @PostMapping
    public ResponseEntity<UserDTO> changeRole(@RequestParam String email) {
        return ResponseEntity.ok(adminService.giveAdmin(email));
    }

    @GetMapping("/tests/{testId}")
    public ResponseEntity<List<UserTestDTO>> userTests(@PathVariable Long testId) {
        return ResponseEntity.ok(adminService.getUserTests(testId));
    }

    @GetMapping("/userTests/{userTestId}")
    public ResponseEntity<UserTestDTO> userTest(@PathVariable Long userTestId) {
        return ResponseEntity.ok(adminService.getUserTest(userTestId));
    }

    @PostMapping("/tests")
    public ResponseEntity<TestDTO> createTest(@RequestBody CreateTestDto testDto) {
        return ResponseEntity.ok(adminService.createTest(testDto));
    }

    @DeleteMapping("/tests/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        adminService.deletedTest(id);
        return ResponseEntity.ok().build();
    }


}
