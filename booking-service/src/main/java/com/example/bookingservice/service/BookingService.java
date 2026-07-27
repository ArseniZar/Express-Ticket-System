package com.example.bookingservice.service;

import com.example.bookingservice.client.InventoryClient;
import com.example.bookingservice.client.WalletClient;
import com.example.bookingservice.dto.booking.CreateBookingRequest;
import com.example.bookingservice.dto.booking.DeleteBookingRequest;
import com.example.bookingservice.dto.booking.GetAllBookingByUserRequest;
import com.example.bookingservice.dto.booking.GetBookingRequest;
import com.example.bookingservice.dto.booking.PayBookingRequest;
import com.example.bookingservice.model.*;
import com.example.bookingservice.repository.BookingRepository;
import com.example.bookingservice.repository.UserRepository;
import com.example.bookingservice.reporting.ReportPublisher;
import com.example.bookingservice.reporting.ReportMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final InventoryClient inventoryClient;
    private final ReportPublisher reportPublisher;
    private final WalletClient walletClient;

    public BookingService(BookingRepository repository, UserRepository userRepository,
            InventoryClient inventoryClient, ReportPublisher reportPublisher, WalletClient walletClient) {
        this.bookingRepository = repository;
        this.userRepository = userRepository;
        this.inventoryClient = inventoryClient;
        this.reportPublisher = reportPublisher;
        this.walletClient = walletClient;
    }

    @Transactional
    public Booking createBooking(CreateBookingRequest request) {
        if (!userRepository.existsById(request.userId())) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_CREATION_FAILED", "booking", null, request.userId(),
                    "reason=User not found: " + request.userId(), Instant.now().toString()));
            throw new RuntimeException("User not found: " + request.userId());
        }

        try {
            var event = inventoryClient.getEventById(request.eventId());
            if (event == null) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "BOOKING_CREATION_FAILED", "booking", null,
                        request.userId(),
                        "reason=Event not found: " + request.eventId(),
                        Instant.now().toString()));
                throw new RuntimeException("Event not found: " + request.eventId());
            }

            if (request.seats() > event.getAvailableSeats()) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "BOOKING_CREATION_FAILED", "booking", null, request.userId(),
                        "reason=Not enough seats for event: " + request.eventId(),
                        Instant.now().toString()));
                throw new RuntimeException("Not enough seats available");
            }
            event.setAvailableSeats(event.getAvailableSeats() - request.seats());
            inventoryClient.updateEvent(event);

            BigDecimal unitPrice = BigDecimal.valueOf(event.getPrice());
            BigDecimal seats = BigDecimal.valueOf(request.seats());
            BigDecimal totalPrice = unitPrice.multiply(seats);

            Booking booking = new Booking(request.userId(), event.getId(),
                    request.seats(), totalPrice, BookingStatus.PENDING);
            Booking saved = bookingRepository.save(booking);

            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_CREATION_CREATED", "booking", saved.getId(),
                    saved.getUserId(),
                    "seats=" + saved.getSeats(), Instant.now().toString()));
            return saved;

        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_CREATION_FAILED", "booking", null, request.userId(),
                    "reason=Event not found: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Event not found: " + request.eventId());
        }

    }

    @Transactional
    public Booking deleteBooking(DeleteBookingRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseGet(() -> {
                    reportPublisher.publish(new ReportMessage(
                            "booking-service", "BOOKING_CANCEL_FAILED", "booking",
                            request.bookingId(), null,
                            "reason=Booking not found", Instant.now().toString()));
                    throw new RuntimeException("Booking not found with id: " + request.bookingId());
                });

        try {
            var event = inventoryClient.getEventById(booking.getEventId());
            if (event == null) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "BOOKING_CANCEL_FAILED", "booking", booking.getId(),
                        booking.getUserId(),
                        "reason=Event not found: " + booking.getEventId(), Instant.now().toString()));
                throw new RuntimeException("Event not found: " + booking.getEventId());
            }

            event.setAvailableSeats(event.getAvailableSeats() + booking.getSeats());
            inventoryClient.updateEvent(event);
            booking.setStatus(BookingStatus.CANCELLED);

            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_CANCEL_CANCELLED", "booking",
                    booking.getId(), booking.getUserId(),
                    "status=cancelled", Instant.now().toString()));

            return booking;
        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_CANCEL_FAILED", "booking", booking.getId(),
                    booking.getUserId(),
                    "reason=Failed to cancel booking: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Failed to cancel booking: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Booking payBooking(PayBookingRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseGet(() -> {
                    reportPublisher.publish(new ReportMessage(
                            "booking-service", "BOOKING_PAYMENT_FAILED", "booking",
                            request.bookingId(), null,
                            "reason=Booking not found", Instant.now().toString()));
                    throw new RuntimeException("Booking not found with id: " + request.bookingId());
                });
        try {
            var walletResponse = walletClient.getWalletByUserId(booking.getUserId());
            if (!walletResponse.getSuccess()) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "BOOKING_PAYMENT_FAILED", "wallet", null,
                        booking.getUserId(),
                        "reason=Wallet not found for user: " + booking.getUserId(),
                        Instant.now().toString()));
                throw new RuntimeException("Wallet not found: " + booking.getUserId());
            }

            try {
                var responce = walletClient.withdrawById(walletResponse.getWallet().getWalletId(),
                        booking.getTotalPrice().doubleValue());
                if (!responce.getSuccess()) {
                    reportPublisher.publish(new ReportMessage(
                            "booking-service", "BOOKING_PAYMENT_FAILED", "wallet",
                            walletResponse.getWallet().getWalletId(),
                            booking.getUserId(),
                            "reason=Wallet withdrawal failed: " + responce.getMessage(),
                            Instant.now().toString()));
                    throw new RuntimeException(
                            "Wallet withdrawal failed: " + responce.getMessage());
                }
            } catch (Exception e) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "BOOKING_PAYMENT_FAILED", "wallet",
                        walletResponse.getWallet().getWalletId(), booking.getUserId(),
                        "reason=Wallet service error: " + e.getMessage(),
                        Instant.now().toString()));
                throw new RuntimeException("Wallet service error: " + e.getMessage());
            }

            booking.setStatus(BookingStatus.CONFIRMED);
            Booking saved = bookingRepository.save(booking);

            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_PAYMENT_CONFIRMED", "booking", saved.getId(),
                    saved.getUserId(),
                    "status=confirmed", Instant.now().toString()));

            return saved;

        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_PAYMENT_FAILED", "booking", booking.getId(),
                    booking.getUserId(),
                    "reason=Payment failed: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Payment failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public List<Booking> getAllBookingsByUserId(GetAllBookingByUserRequest request) {

        if (!userRepository.existsById(request.userId())) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "BOOKING_RETRIEVE_FAILED", "booking", null, request.userId(),
                    "reason=User not found: " + request.userId(), Instant.now().toString()));
            throw new RuntimeException("User not found: " + request.userId());
        }

        List<Booking> userBookings = bookingRepository.findByUserId(request.userId());

        if (userBookings.isEmpty()) {
            return List.of();
        }

        return userBookings;
    }

    @Transactional
    public Booking getBookingById(GetBookingRequest request) {
        return bookingRepository.findById(request.bookingId())
                .orElseGet(() -> {
                    reportPublisher.publish(new ReportMessage(
                            "booking-service", "BOOKING_FETCH_FAILED", "booking",
                            request.bookingId(), null,
                            "reason=Booking not found", Instant.now().toString()));
                    throw new RuntimeException("Booking not found with id: " + request.bookingId());
                });
    }

}