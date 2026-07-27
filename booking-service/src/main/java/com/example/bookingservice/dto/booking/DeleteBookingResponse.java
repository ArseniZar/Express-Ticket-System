package com.example.bookingservice.dto.booking;

public record DeleteBookingResponse(
        Long bookingId,
        String status,
        String message
) {}