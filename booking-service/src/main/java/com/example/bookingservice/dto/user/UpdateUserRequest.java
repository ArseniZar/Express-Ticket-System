package com.example.bookingservice.dto.user;

public record UpdateUserRequest(
        String firstName,
        String lastName,
        Integer age,
        String username) {
}
