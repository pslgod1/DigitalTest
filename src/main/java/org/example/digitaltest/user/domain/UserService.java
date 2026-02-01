package org.example.digitaltest.user.domain;

import org.example.digitaltest.user.api.dto.UserDTO;
import org.example.digitaltest.user.api.dto.UserMapper;
import org.example.digitaltest.user.db.Role;
import org.example.digitaltest.user.db.UserEntity;
import org.example.digitaltest.user.db.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Autowired
    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;

        this.userMapper = userMapper;
    }

    //========================================Controller===========================================================
    public UserDTO findCurrentUserDto(){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userMapper.convertEntityToDto(findByEmail(email));
    }
    //========================================Service===========================================================
    public List<UserEntity> findAllByRole(Role role) {
        return userRepository.findAllByRole(role);
    }

    public UserEntity findCurrentUser(){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return findByEmail(email);
    }


    public UserEntity findByEmail(String email) {
        return userRepository.getByEmail(email);
    }

    public UserEntity save(UserEntity user) {
        return userRepository.save(user);
    }

    public UserEntity changePassword(String email, String newPassword) {
        UserEntity user = findByEmail(email);
        user.setPassword(newPassword);
        return save(user);
    }

}
