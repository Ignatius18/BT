package com.mybyteclub.byteclub.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mybyteclub.byteclub.model.CartItem;
import com.mybyteclub.byteclub.model.Product;
import com.mybyteclub.byteclub.model.User;
import com.mybyteclub.byteclub.repository.CartRepository;
import com.mybyteclub.byteclub.repository.ProductRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    public CartController(CartRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<?> addToCart(@PathVariable Long productId, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Необходима авторизация\"}");

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"error\": \"Товар не найден\"}");

        CartItem cartItem = cartRepository.findByUserIdAndProductId(user.getId(), productId)
            .orElse(new CartItem(user.getId(), productId, 0));
        
        cartItem.setQuantity(cartItem.getQuantity() + 1);
        cartRepository.save(cartItem);
        return ResponseEntity.ok("{\"message\": \"Товар добавлен\"}");
    }

    @GetMapping("")
    public ResponseEntity<?> getCart(HttpSession session) {
        logger.info("--- ВЫЗВАН МЕТОД getCart ---");
        
        User user = (User) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Необходима авторизация\"}");
        
        return ResponseEntity.ok(cartRepository.findByUserId(user.getId()));
    }

    @DeleteMapping("/remove/{productId}")
    @Transactional
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Необходима авторизация\"}");
        
        cartRepository.findByUserIdAndProductId(user.getId(), productId).ifPresent(cartRepository::delete);
        return ResponseEntity.ok("{\"message\": \"Товар удален\"}");
    }

    @PostMapping("/update/{productId}")
    @Transactional
    public ResponseEntity<?> updateQuantity(@PathVariable Long productId,
                                            @RequestBody Map<String, Integer> body,
                                            HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"error\": \"Необходима авторизация\"}");

        Integer amount = body == null ? null : body.get("amount");
        if (amount == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("{\"error\": \"Не указано количество\"}");

        var existingOpt = cartRepository.findByUserIdAndProductId(user.getId(), productId);

        if (existingOpt.isPresent()) {
            CartItem cartItem = existingOpt.get();
            int newQty = cartItem.getQuantity() + amount;
            if (newQty <= 0) {
                cartRepository.delete(cartItem);
                return ResponseEntity.ok("{\"message\": \"Удалено\"}");
            }
            cartItem.setQuantity(newQty);
            cartRepository.save(cartItem);
            return ResponseEntity.ok("{\"message\": \"Обновлено\"}");
        } else {
            if (amount <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("{\"error\": \"Неверное количество\"}");
            }
            cartRepository.save(new CartItem(user.getId(), productId, amount));
            return ResponseEntity.ok("{\"message\": \"Добавлено\"}");
        }
    }
}
