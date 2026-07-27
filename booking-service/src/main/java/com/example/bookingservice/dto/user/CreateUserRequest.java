package com.example.bookingservice.dto.user;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(
        @NotBlank String username,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Min(0) int age
) {}