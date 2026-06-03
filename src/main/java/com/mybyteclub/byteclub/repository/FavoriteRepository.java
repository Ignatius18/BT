package com.mybyteclub.byteclub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mybyteclub.byteclub.model.FavoriteItem;

public interface FavoriteRepository extends JpaRepository<FavoriteItem, Long> {

    List<FavoriteItem> findByUserId(Long userId);

    Optional<FavoriteItem> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserId(Long userId);
} 
