package com.example.bookingservice.dto.wallet;

public record DepositByUserResponse(
        Long userId,
        double newBalance,
        String message
) {
    
}
