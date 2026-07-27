package com.example.bookingservice.service;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.example.bookingservice.client.WalletClient;
import com.example.bookingservice.dto.wallet.DepositByUserRequest;
import com.example.bookingservice.dto.wallet.GetWalletByUserRequest;
import com.example.bookingservice.reporting.ReportMessage;
import com.example.bookingservice.reporting.ReportPublisher;
import com.example.bookingservice.repository.UserRepository;
import com.example.common.grpc.wallet.WalletDto;

import jakarta.transaction.Transactional;

@Service
public class WalletService {

    private final UserRepository userRepository;
    private final ReportPublisher reportPublisher;
    private final WalletClient walletClient;

    public WalletService(UserRepository userRepository, ReportPublisher reportPublisher, WalletClient walletClient) {
        this.userRepository = userRepository;
        this.reportPublisher = reportPublisher;
        this.walletClient = walletClient;
    }

    @Transactional
    public WalletDto getWalletByUserId(GetWalletByUserRequest request) {
        if (!userRepository.existsById(request.userId())) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "WALLET_RETRIEVAL_FAILED", "wallet", null, request.userId(),
                    "reason=User not found: " + request.userId(), Instant.now().toString()));
            throw new RuntimeException("User not found: " + request.userId());
        }

        try {
            var wallet = walletClient.getWalletByUserId(request.userId());
            if (!wallet.getSuccess()) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "WALLET_RETRIEVAL_FAILED", "wallet", null, request.userId(),
                        "reason=Wallet not found for user: " + request.userId(), Instant.now().toString()));
                throw new RuntimeException("Wallet not found for user: " + request.userId());
            }
            return wallet.getWallet();
        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "WALLET_RETRIEVAL_FAILED", "wallet", null, request.userId(),
                    "reason=Failed to retrieve wallet: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Failed to retrieve wallet: " + e.getMessage(), e);
        }
    }

    @Transactional
    public WalletDto depositByUserId(DepositByUserRequest request) {
         Long userId = request.userId();
         double amount = request.amount();
        if (!userRepository.existsById(userId)) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "WALLET_DEPOSIT_FAILED", "wallet", null, userId,
                    "reason=User not found: " + userId, Instant.now().toString()));
            throw new RuntimeException("User not found: " + userId);
        }

        try {
            var response = walletClient.depositByUserId(userId, amount);
            if (!response.getSuccess()) {
                reportPublisher.publish(new ReportMessage(
                        "booking-service", "WALLET_DEPOSIT_FAILED", "wallet", null, userId,
                        "reason=Deposit failed: " + response.getMessage(), Instant.now().toString()));
                throw new RuntimeException("Deposit failed: " + response.getMessage());
            }
            return walletClient.getWalletByUserId(userId).getWallet();
        } catch (Exception e) {
            reportPublisher.publish(new ReportMessage(
                    "booking-service", "WALLET_DEPOSIT_FAILED", "wallet", null, userId,
                    "reason=Failed to deposit: " + e.getMessage(), Instant.now().toString()));
            throw new RuntimeException("Failed to deposit: " + e.getMessage(), e);
        }
    }
}
