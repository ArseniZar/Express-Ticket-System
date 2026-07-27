package com.example.bookingservice.dto.booking;

import java.math.BigDecimal;

public record PayBookingResponse (
    Long bookingId,
    String status,
    BigDecimal totalPrice,
    String message
){}
