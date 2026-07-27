package com.example.walletservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;

    @Column(name = "balance", nullable = false)
    private Double balance = 0.0;

    public Wallet() {}

    public Wallet(Long userId) {
        this.userId = userId;
        this.balance = 0.0;
    }

    public Wallet(Long userId, Double balance) {
        this.userId = userId;
        this.balance = balance != null ? balance : 0.0;
    }


    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public Long getUserId() { 
        return userId; 
    }
    
    public void setUserId(Long userId) { 
        this.userId = userId; 
    }

    public Double getBalance() { 
        return balance; 
    }
    
    public void setBalance(Double balance) { 
        this.balance = balance; 
    }
}