package com.example.bookingservice.dto.wallet;

public record GetWalletByUserResponse(
        Long userId,
        double balance
) {
    
}
