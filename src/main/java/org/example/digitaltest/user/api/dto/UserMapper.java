package org.example.digitaltest.user.api.dto;

import org.example.digitaltest.user.db.UserEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDTO convertEntityToDto(UserEntity userEntity) {
        return new UserDTO(
                userEntity.getId(),
                userEntity.getName(),
                userEntity.getEmail(),
                userEntity.getPassword(),
                userEntity.getCreatedAt(),
                userEntity.getRole()
        );
    }

    public UserEntity convertDtoToEntity(UserDTO userDTO) {
        return new UserEntity(
               userDTO.id(),
               userDTO.name(),
               userDTO.email(),
               userDTO.password(),
               userDTO.createAt(),
               userDTO.role()
        );
    }

    public List<UserDTO> convertEntityListToDTOList(List<UserEntity> userEntities) {
        return userEntities
                .stream()
                .map(this::convertEntityToDto)
                .collect(Collectors.toList());
    }
}
