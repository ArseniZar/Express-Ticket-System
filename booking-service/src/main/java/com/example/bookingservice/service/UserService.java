package com.example.bookingservice.service;

import com.example.bookingservice.client.WalletClient;
import com.example.bookingservice.dto.user.CreateUserRequest;
import com.example.bookingservice.dto.user.DeleteUserRequest;
import com.example.bookingservice.dto.user.GetUserRequest;
import com.example.bookingservice.dto.user.UpdateUserRequest;
import com.example.bookingservice.model.User;
import com.example.bookingservice.reporting.ReportPublisher;
import com.example.bookingservice.repository.UserRepository;
import com.example.bookingservice.reporting.ReportMessage;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ReportPublisher reportPublisher;
    private final WalletClient walletClient;

    public UserService(UserRepository userRepository, ReportPublisher reportPublisher, WalletClient walletClient) {
        this.userRepository = userRepository;
        this.reportPublisher = reportPublisher;
        this.walletClient = walletClient;
    }

    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_CREATION_FAILED", "user", null, null,
                    "reason=User with username '" + request.username() + "' already exists", Instant.now().toString()));
            throw new RuntimeException("User with username '" + request.username() + "' already exists");
        }

        User user = new User(
                request.username(),
                request.firstName(),
                request.lastName(),
                request.age());
        User savedUser = userRepository.save(user);

        try {
            var walletResponse = walletClient.getWalletByUserId(savedUser.getId());
            if (walletResponse.getSuccess()) {
                userRepository.delete(savedUser);
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "USER_CREATION_FAILED", "wallet", null, savedUser.getId(),
                        "reason=Wallet already exists for user: " + savedUser.getId(), Instant.now().toString()));
                throw new RuntimeException("Wallet already exists for user: " + savedUser.getId());
            }
        } catch (Exception e) {
            userRepository.delete(savedUser);
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_CREATION_FAILED", "wallet", null, savedUser.getId(),
                    "reason=" + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Wallet service error: " + e.getMessage());
        }

        try {
            var creationResponse = walletClient.createWallet(savedUser.getId());
            if (!creationResponse.getSuccess()) {
                userRepository.delete(savedUser);
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "USER_CREATION_FAILED", "wallet", null, savedUser.getId(),
                        "reason=" + creationResponse.getMessage(), Instant.now().toString()));
                throw new RuntimeException("Failed to create wallet: " + creationResponse.getMessage());
            } else {
                reportPublisher.publish(new ReportMessage(
                        "booking-service",
                        "USER_CREATED",
                        "wallet",
                        creationResponse.getWalletId(),
                        savedUser.getId(),
                        "Wallet created successfully, initial balance: 0.0",
                        Instant.now().toString()));
            }

        } catch (Exception e) {
            userRepository.delete(savedUser);
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_CREATION_FAILED", "wallet", null, savedUser.getId(),
                    "reason=" + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Wallet service error: " + e.getMessage());
        }

        reportPublisher.publish(new ReportMessage(
                "booking-service",
                "USER_CREATED",
                "user",
                savedUser.getId(),
                savedUser.getId(),
                "User created successfully",
                Instant.now().toString()));

        return savedUser;
    }

    @Transactional
    public User updateUser(Long userId, UpdateUserRequest request) {
        java.util.Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_UPDATE_FAILED", "user", userId, null,
                    "reason=User not found: " + userId, Instant.now().toString()));

            throw new RuntimeException("User not found: " + userId);
        }

        User user = userOptional.get();
        user.setUsername(request.username());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setAge(request.age());
        var save = userRepository.save(user);

        reportPublisher.publish(new ReportMessage(
                "booking-service",
                "USER_UPDATED",
                "user",
                userId,
                userId,
                "User updated successfully",
                Instant.now().toString()));
        return save;

    }

    @Transactional
    public void deleteUser(DeleteUserRequest request) {
        java.util.Optional<User> userOptional = userRepository.findById(request.userId());
        if (userOptional.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_DELETION_FAILED", "user", request.userId(), null,
                    "reason=User not found: " + request.userId(), Instant.now().toString()));

            throw new RuntimeException("User not found: " + request.userId());
        }
        userRepository.deleteById(request.userId());
        reportPublisher.publish(new ReportMessage(
                "booking-service",
                "USER_DELETED",
                "user",
                request.userId(),
                request.userId(),
                "User deleted successfully",
                Instant.now().toString()));
    }

    @Transactional
    public User getUserById(GetUserRequest request) {
        java.util.Optional<User> userOptional = userRepository.findById(request.userId());

        if (userOptional.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_RETRIEVAL_FAILED", "user", request.userId(), null,
                    "reason=User not found: " + request.userId(), Instant.now().toString()));

            throw new RuntimeException("User not found: " + request.userId());
        }

        return userOptional.get();
    }

    @Transactional
    public User getUserByUsername(String username) {
        java.util.Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "USER_RETRIEVAL_FAILED", "user", null, null,
                    "reason=User not found with username: " + username, Instant.now().toString()));

            throw new RuntimeException("User not found with username: " + username);
        }

        return userOptional.get();
    }

    @Transactional
    public List<User> getAllUsers() {
        var users = userRepository.findAll();
        reportPublisher.publish(new ReportMessage(
                "booking-service", "USER_LIST_RETRIEVED", "user", null, null,
                "Retrieved " + users.size() + " users", Instant.now().toString()));
        return users;
    }

}