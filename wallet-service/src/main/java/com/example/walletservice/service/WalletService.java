package com.example.walletservice.service;

import com.example.walletservice.model.Wallet;
import com.example.walletservice.repository.WalletRepository;
import com.example.walletservice.reporting.ReportMessage;
import com.example.walletservice.reporting.ReportPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final ReportPublisher reportPublisher;

    public WalletService(WalletRepository walletRepository, ReportPublisher reportPublisher) {
        this.walletRepository = walletRepository;
        this.reportPublisher = reportPublisher;
    }

    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    public Optional<Wallet> getWalletById(Long walletId) {
        return walletRepository.findById(walletId);
    }

    public Optional<Wallet> getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId);
    }

    @Transactional
    public Wallet createWallet(Long userId) {
        if (walletRepository.existsByUserId(userId)) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", 
                    "WALLET_CREATE_FAILED", 
                    "wallet", 
                    null, 
                    userId, 
                    "reason=already_exists", 
                    Instant.now().toString()
            ));
            throw new IllegalStateException("Wallet already exists for user: " + userId);
        }
        
        Wallet wallet = new Wallet(userId);
        Wallet savedWallet = walletRepository.save(wallet);

        reportPublisher.publish(new ReportMessage(
                "wallet-service", 
                "WALLET_CREATED", 
                "wallet", 
                savedWallet.getId(), 
                userId, 
                "balance=0.0", 
                Instant.now().toString()
        ));
        
        return savedWallet;
    }

    @Transactional
    public void deleteByWalletId(Long walletId) {
        Optional<Wallet> walletOpt = walletRepository.findById(walletId);
        
       if (walletOpt.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_DELETE_FAILED", "wallet",
                    walletId, null, "reason=not_found", Instant.now().toString()
            ));
            throw new IllegalArgumentException("Wallet not found by ID: " + walletId);
        }

        Wallet wallet = walletOpt.get();
        walletRepository.deleteById(walletId);
        
        reportPublisher.publish(new ReportMessage(
                "wallet-service", "WALLET_DELETED", "wallet",
                walletId, wallet.getUserId(), "Deleted by wallet_id", Instant.now().toString()
        ));
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        
        if (walletOpt.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_DELETE_FAILED", "wallet",
                    null, userId, "reason=not_found", Instant.now().toString()
            ));
            throw new IllegalArgumentException("Wallet not found for User ID: " + userId);
        }

        Wallet wallet = walletOpt.get();
        walletRepository.deleteByUserId(userId);
        
        reportPublisher.publish(new ReportMessage(
                "wallet-service", "WALLET_DELETED", "wallet",
                wallet.getId(), userId, "Deleted by user_id", Instant.now().toString()
        ));
    }

    @Transactional
    public Wallet depositByWalletId(Long walletId, Double amount) {
        Optional<Wallet> walletOpt = walletRepository.findById(walletId);
        
        if (walletOpt.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_DEPOSIT_FAILED", "wallet",
                    walletId, null, "reason=not_found, amount=" + amount, Instant.now().toString()
            ));
            throw new IllegalArgumentException("Wallet not found by ID: " + walletId);
        }
        
        return executeDeposit(walletOpt.get(), amount);
    }

    @Transactional
    public Wallet depositByUserId(Long userId, Double amount) {
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        
        if (walletOpt.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_DEPOSIT_FAILED", "wallet",
                    null, userId, "reason=not_found, amount=" + amount, Instant.now().toString()
            ));
            throw new IllegalArgumentException("Wallet not found for User ID: " + userId);
        }
        
        return executeDeposit(walletOpt.get(), amount);
    }

    private Wallet executeDeposit(Wallet wallet, Double amount) {
        if (amount <= 0) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_DEPOSIT_FAILED", "wallet",
                    wallet.getId(), wallet.getUserId(), "reason=invalid_amount, amount=" + amount, Instant.now().toString()
            ));
            throw new IllegalArgumentException("Deposit amount must be greater than 0");
        }
        
        wallet.setBalance(wallet.getBalance() + amount);
        Wallet updated = walletRepository.save(wallet);

        reportPublisher.publish(new ReportMessage(
                "wallet-service", "WALLET_DEPOSIT", "wallet",
                updated.getId(), updated.getUserId(), "amount=" + amount, Instant.now().toString()
        ));
        
        return updated;
    }

    @Transactional
    public Wallet withdrawByWalletId(Long walletId, Double amount) {
        Optional<Wallet> walletOpt = walletRepository.findById(walletId);
        
        if (walletOpt.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_WITHDRAW_FAILED", "wallet",
                    walletId, null, "reason=not_found, amount=" + amount, Instant.now().toString()
            ));
            throw new IllegalArgumentException("Wallet not found by ID: " + walletId);
        }
        
        return executeWithdraw(walletOpt.get(), amount);
    }

    @Transactional
    public Wallet withdrawByUserId(Long userId, Double amount) {
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        
        if (walletOpt.isEmpty()) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_WITHDRAW_FAILED", "wallet",
                    null, userId, "reason=not_found, amount=" + amount, Instant.now().toString()
            ));
            throw new IllegalArgumentException("Wallet not found for User ID: " + userId);
        }
        
        return executeWithdraw(walletOpt.get(), amount);
    }

    private Wallet executeWithdraw(Wallet wallet, Double amount) {
        if (amount <= 0) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_WITHDRAW_FAILED", "wallet",
                    wallet.getId(), wallet.getUserId(), "reason=invalid_amount, amount=" + amount, Instant.now().toString()
            ));
            throw new IllegalArgumentException("Withdraw amount must be greater than 0");
        }
        
        if (wallet.getBalance() < amount) {
            reportPublisher.publish(new ReportMessage(
                    "wallet-service", "WALLET_WITHDRAW_FAILED", "wallet",
                    wallet.getId(), wallet.getUserId(), "reason=insufficient_funds, amount=" + amount, Instant.now().toString()
            ));
            throw new RuntimeException("Insufficient funds! Current balance: " + wallet.getBalance());
        }

        wallet.setBalance(wallet.getBalance() - amount);
        Wallet updated = walletRepository.save(wallet);

        reportPublisher.publish(new ReportMessage(
                "wallet-service", "WALLET_WITHDRAW", "wallet",
                updated.getId(), updated.getUserId(), "amount=" + amount, Instant.now().toString()
        ));
        
        return updated;
    }
}