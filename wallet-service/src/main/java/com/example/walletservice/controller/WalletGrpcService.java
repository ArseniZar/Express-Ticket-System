package com.example.walletservice.controller;

import com.example.common.grpc.wallet.*;
import com.example.walletservice.model.Wallet;
import com.example.walletservice.service.WalletService;

import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

@GrpcService
public class WalletGrpcService extends WalletServiceGrpc.WalletServiceImplBase {

    private final WalletService walletService;

    public WalletGrpcService(WalletService walletService) {
        this.walletService = walletService;
    }

    @Override
    public void createWallet(CreateWalletRequest request, StreamObserver<CreateWalletResponse> responseObserver) {
        try {
            Wallet wallet = walletService.createWallet(request.getUserId());
            responseObserver.onNext(CreateWalletResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Wallet created successfully with balance 0.0")
                    .setWalletId(wallet.getId())
                    .build());
        } catch (Exception e) {
            responseObserver.onNext(CreateWalletResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to create wallet: " + e.getMessage())
                    .build());
        }
        responseObserver.onCompleted();
    }

    @Override
    public void deleteWallet(DeleteWalletRequest request, StreamObserver<DeleteWalletResponse> responseObserver) {
        try {
            switch (request.getIdentifierCase()) {
                case WALLET_ID -> walletService.deleteByWalletId(request.getWalletId());
                case USER_ID -> walletService.deleteByUserId(request.getUserId());
                case IDENTIFIER_NOT_SET -> throw new IllegalArgumentException("Identifier must be provided");
            }
            responseObserver.onNext(DeleteWalletResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Wallet deleted successfully")
                    .build());
        } catch (Exception e) {
            responseObserver.onNext(DeleteWalletResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Deletion failed: " + e.getMessage())
                    .build());
        }
        responseObserver.onCompleted();
    }

    @Override
    public void getAllWallets(GetAllWalletsRequest request, StreamObserver<GetAllWalletsResponse> responseObserver) {
        try {
            List<Wallet> wallets = walletService.getAllWallets();
            GetAllWalletsResponse.Builder responseBuilder = GetAllWalletsResponse.newBuilder();
            for (Wallet w : wallets) {
                responseBuilder.addWallets(mapToDto(w));
            }
            responseObserver.onNext(responseBuilder.build());
        } catch (Exception e) {
            responseObserver.onNext(GetAllWalletsResponse.newBuilder().build());
        }
        responseObserver.onCompleted();
    }

    @Override
    public void getWalletById(GetWalletByIdRequest request, StreamObserver<GetWalletByResponse> responseObserver) {
        walletService.getWalletById(request.getWalletId()).ifPresentOrElse(
            wallet -> responseObserver.onNext(GetWalletByResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Wallet found by ID")
                    .setWallet(mapToDto(wallet))
                    .build()),
            () -> responseObserver.onNext(GetWalletByResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Wallet not found by ID: " + request.getWalletId())
                    .build())
        );
        responseObserver.onCompleted();
    }

    @Override
    public void getWalletByUserId(GetWalletByUserIdRequest request, StreamObserver<GetWalletByResponse> responseObserver) {
        walletService.getWalletByUserId(request.getUserId()).ifPresentOrElse(
            wallet -> responseObserver.onNext(GetWalletByResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Wallet found by User ID")
                    .setWallet(mapToDto(wallet))
                    .build()),
            () -> responseObserver.onNext(GetWalletByResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Wallet not found for User ID: " + request.getUserId())
                    .build())
        );
        responseObserver.onCompleted();
    }

    @Override
    public void deposit(DepositRequest request, StreamObserver<DepositResponse> responseObserver) {
        try {
            Wallet updatedWallet = (request.getIdentifierCase() == DepositRequest.IdentifierCase.WALLET_ID) 
                ? walletService.depositByWalletId(request.getWalletId(), request.getAmount())
                : walletService.depositByUserId(request.getUserId(), request.getAmount());

            responseObserver.onNext(DepositResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Account funded successfully")
                    .setNewBalance(updatedWallet.getBalance())
                    .build());
        } catch (Exception e) {
            responseObserver.onNext(DepositResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Deposit failed: " + e.getMessage())
                    .build());
        }
        responseObserver.onCompleted();
    }

    @Override
    public void withdraw(WithdrawRequest request, StreamObserver<WithdrawResponse> responseObserver) {
        try {
            Wallet updatedWallet = (request.getIdentifierCase() == WithdrawRequest.IdentifierCase.WALLET_ID) 
                ? walletService.withdrawByWalletId(request.getWalletId(), request.getAmount())
                : walletService.withdrawByUserId(request.getUserId(), request.getAmount());

            responseObserver.onNext(WithdrawResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Amount withdrawn successfully")
                    .setNewBalance(updatedWallet.getBalance())
                    .build());
        } catch (Exception e) {
            responseObserver.onNext(WithdrawResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Withdraw failed: " + e.getMessage())
                    .build());
        }
        responseObserver.onCompleted();
    }

    private WalletDto mapToDto(Wallet wallet) {
        return WalletDto.newBuilder()
                .setWalletId(wallet.getId())
                .setUserId(wallet.getUserId())
                .setBalance(wallet.getBalance())
                .build();
    }
}