package com.mybyteclub.byteclub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mybyteclub.byteclub.model.FavoriteItem;
import com.mybyteclub.byteclub.model.Product;
import com.mybyteclub.byteclub.model.User;
import com.mybyteclub.byteclub.repository.FavoriteRepository;
import com.mybyteclub.byteclub.repository.ProductRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;

    public FavoriteController(FavoriteRepository favoriteRepository,
                              ProductRepository productRepository) {
        this.favoriteRepository = favoriteRepository;
        this.productRepository = productRepository;
    }

    // 📦 Получить все товары из избранного пользователя
    @GetMapping
    public ResponseEntity<?> getFavorites(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Необходима авторизация\"}");
        }

        List<Long> productIds = favoriteRepository.findByUserId(user.getId())
                .stream()
                .map(FavoriteItem::getProductId)
                .toList();

        List<Product> products = productRepository.findAllById(productIds);

        return ResponseEntity.ok(products);
    }

    // ❤️ Добавить или убрать товар (toggle)
    // ВНИМАНИЕ: Путь должен быть /api/favorites/toggle/{productId}
    @PostMapping("/toggle/{productId}")
    public ResponseEntity<?> toggleFavorite(@PathVariable Long productId,
                                            HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Необходима авторизация\"}");
        }

        var existing = favoriteRepository.findByUserIdAndProductId(user.getId(), productId);

        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return ResponseEntity.ok("{\"message\": \"Удалено\"}");
        }

        favoriteRepository.save(new FavoriteItem(user.getId(), productId));
        return ResponseEntity.ok("{\"message\": \"Добавлено\"}");
    }

    // 🧹 Очистка всего списка избранного
    @DeleteMapping("/clear")
    public ResponseEntity<?> clear(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"error\": \"Необходима авторизация\"}");
        }

        favoriteRepository.deleteByUserId(user.getId());
        return ResponseEntity.ok("{\"message\": \"Очищено\"}");
    }

    // 🔢 Получить список ID товаров, которые в избранном (для UI)
    @GetMapping("/ids")
    public ResponseEntity<?> getFavoriteIds(HttpSession session) {
        User user = (User) session.getAttribute("user");

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("unauthorized");
        }

        List<Long> ids = favoriteRepository.findByUserId(user.getId())
                .stream()
                .map(FavoriteItem::getProductId)
                .toList();

        return ResponseEntity.ok(ids);
    }
}
