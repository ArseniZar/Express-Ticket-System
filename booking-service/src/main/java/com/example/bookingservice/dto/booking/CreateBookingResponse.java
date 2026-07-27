package com.example.bookingservice.dto.booking;

import java.math.BigDecimal;

public record CreateBookingResponse(
        Long bookingId,
        BigDecimal totalPrice,
        String status,
        String message
) {}