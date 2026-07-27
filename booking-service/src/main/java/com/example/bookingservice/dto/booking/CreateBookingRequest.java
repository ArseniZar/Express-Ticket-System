package com.example.bookingservice.dto.booking;
public record CreateBookingRequest(
        Long userId,
        Long eventId,
        int seats
) {}