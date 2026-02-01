package org.example.digitaltest.user.db;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    UserEntity getByEmail(String email);

    List<UserEntity> findAllByRole(Role role);
}
