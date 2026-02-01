package org.example.digitaltest.test.db;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.digitaltest.question.db.QuestionEntity;
import org.example.digitaltest.user.db.UserEntity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "template_tests")
public class TestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 1000)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Column(name = "create_at")
    private LocalDateTime createdAt;

    @OneToMany(cascade = CascadeType.REMOVE, mappedBy = "test",orphanRemoval = true,fetch = FetchType.EAGER)
    private Set<QuestionEntity> questions = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admin")
    private UserEntity admin;


}
