package org.example.digitaltest.userTestAttempt.db;

import lombok.Getter;
import lombok.Setter;
import org.example.digitaltest.test.db.TestEntity;
import org.example.digitaltest.user.db.UserEntity;
import org.example.digitaltest.userAnswer.db.UserAnswerEntity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "user_test_attempts",
        indexes = {@Index(name = "idx_user_id", columnList = "user_id")})
public class UserTestAttemptEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_id", nullable = false)
    private TestEntity test;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "percentage")
    private Double percentage;//Процент

    @OneToMany(mappedBy = "testAttempt", cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private Set<UserAnswerEntity> userAnswers = new HashSet<>();

    public void addUserAnswer(UserAnswerEntity userAnswerEntity) {
        userAnswers.add(userAnswerEntity);
    }
}