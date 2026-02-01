package org.example.digitaltest.userTestAttempt.db;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTestRepository extends JpaRepository<UserTestAttemptEntity,Long> {

    List<UserTestAttemptEntity> findAllByUserId(Long userId);

    @Query("SELECT ut FROM UserTestAttemptEntity ut WHERE ut.user.id = :userId")
    List<UserTestAttemptEntity> findAllByUserIdWithTest(@Param("userId") Long userId);

    // Используйте @EntityGraph правильно
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user", "test"})
    @Query("SELECT ut FROM UserTestAttemptEntity ut WHERE ut.id = :id")
    UserTestAttemptEntity findByIdWithUserAndTest(@Param("id") Long id);

    // Альтернативный вариант с JOIN FETCH
    @Query("""
        SELECT ut FROM UserTestAttemptEntity ut 
        LEFT JOIN FETCH ut.user 
        LEFT JOIN FETCH ut.test 
        WHERE ut.id = :id
    """)
    UserTestAttemptEntity findByIdWithUserAndTestFetch(@Param("id") Long id);

    List<UserTestAttemptEntity> findAllByTestId(Long testId);
}
