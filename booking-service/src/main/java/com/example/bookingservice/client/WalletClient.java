package com.example.bookingservice.client;


import net.devh.boot.grpc.client.inject.GrpcClient;
import com.example.common.grpc.wallet.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class WalletClient {

    @GrpcClient("wallet-service")
    private WalletServiceGrpc.WalletServiceBlockingStub walletStub;

    public CreateWalletResponse createWallet(long userId) {
        return walletStub.createWallet(CreateWalletRequest.newBuilder()
                .setUserId(userId)
                .build());
    }

    public DeleteWalletResponse deleteWalletByUserId(long userId) {
        return walletStub.deleteWallet(DeleteWalletRequest.newBuilder()
                .setUserId(userId)
                .build());
    }

    public List<WalletDto> getAllWallets() {
        GetAllWalletsResponse response = walletStub.getAllWallets(GetAllWalletsRequest.newBuilder().build());
        return response.getWalletsList() != null ? response.getWalletsList() : Collections.emptyList();
    }

    public GetWalletByResponse getWalletById(long walletId) {
        return walletStub.getWalletById(GetWalletByIdRequest.newBuilder()
                .setWalletId(walletId)
                .build());
    }

    public GetWalletByResponse getWalletByUserId(long userId) {
        return walletStub.getWalletByUserId(GetWalletByUserIdRequest.newBuilder()
                .setUserId(userId)
                .build());
    }

    public DepositResponse depositByUserId(long userId, double amount) {
        return walletStub.deposit(DepositRequest.newBuilder()
                .setUserId(userId)
                .setAmount(amount)
                .build());
    }

    public DepositResponse depositById(long walletId, double amount) {
        return walletStub.deposit(DepositRequest.newBuilder()
                .setWalletId(walletId)
                .setAmount(amount)
                .build());
    }

    public WithdrawResponse withdrawByUserId(long userId, double amount) {
        return walletStub.withdraw(WithdrawRequest.newBuilder()
                .setUserId(userId)
                .setAmount(amount)
                .build());
    }

    public WithdrawResponse withdrawById(long walletId, double amount) {
        return walletStub.withdraw(WithdrawRequest.newBuilder()
                .setWalletId(walletId)
                .setAmount(amount)
                .build());
    }
}
