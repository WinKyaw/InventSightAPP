package com.pos.inventsight.service;

import com.pos.inventsight.entity.User;
import com.pos.inventsight.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for User operations
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }
}
