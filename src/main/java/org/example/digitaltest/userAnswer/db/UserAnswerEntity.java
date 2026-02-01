package org.example.digitaltest.userAnswer.db;

import lombok.Getter;
import lombok.Setter;
import org.example.digitaltest.question.db.QuestionEntity;
import org.example.digitaltest.userTestAttempt.db.UserTestAttemptEntity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "user_answers")
public class UserAnswerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_attempt_id", nullable = false)
    private UserTestAttemptEntity testAttempt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionEntity question;

    @Column(name = "selected_answer_index")
    private Integer selectedAnswerIndex;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;
}