package org.example.digitaltest.question.db;

import lombok.Getter;
import lombok.Setter;
import org.example.digitaltest.test.db.TestEntity;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "questions")
public class QuestionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question", length = 25000, nullable = false)
    private String question;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_answer",
            joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "answer", length = 25000)
    private List<String> answer = new ArrayList<>();

    @Column(name = "correct_answer_index")
    private Integer correctAnswerIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private Type type;

    @ManyToOne(cascade = CascadeType.REMOVE,fetch = FetchType.EAGER)
    @JoinColumn(name = "test_id")
    private TestEntity test;
}
