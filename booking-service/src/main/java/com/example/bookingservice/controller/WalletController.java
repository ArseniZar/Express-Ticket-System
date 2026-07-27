package com.example.bookingservice.controller;

import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.bookingservice.dto.wallet.DepositByUserRequest;
import com.example.bookingservice.dto.wallet.DepositByUserResponse;
import com.example.bookingservice.dto.wallet.GetWalletByUserRequest;
import com.example.bookingservice.dto.wallet.GetWalletByUserResponse;
import com.example.bookingservice.service.WalletService;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping("/user/deposit")
    public ResponseEntity<?> depositByUser(@RequestBody DepositByUserRequest request) {
        try {
            var wallet = walletService.depositByUserId(request);
            var response = new DepositByUserResponse(
                    wallet.getUserId(),
                    wallet.getBalance(),
                    "Deposit successful");

            var model = EntityModel.of(response);
            
            model.add(linkTo(methodOn(WalletController.class).getWalletByUserId(wallet.getUserId())).withRel("wallet-details"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWalletByUserId(@PathVariable Long userId) {
        try {
            var request = new GetWalletByUserRequest(userId);
            var wallet = walletService.getWalletByUserId(request);
            var response = new GetWalletByUserResponse(
                    wallet.getUserId(),
                    wallet.getBalance());

            var model = EntityModel.of(response);
            
            model.add(linkTo(methodOn(WalletController.class).getWalletByUserId(userId)).withSelfRel());
            model.add(linkTo(methodOn(WalletController.class).depositByUser(null)).withRel("deposit"));

            return ResponseEntity.ok(model);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}