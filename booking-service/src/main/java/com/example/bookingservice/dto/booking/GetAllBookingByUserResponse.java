package com.example.bookingservice.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GetAllBookingByUserResponse(
    Long bookingId,
    Long userId,
    Long eventId,
    String status,
    Integer seats,
    BigDecimal totalPrice,
    LocalDateTime createdAt

){}