package com.example.bookingservice.dto.wallet;

public record DepositByUserRequest(
        Long userId,
        double amount
) {
    
}
