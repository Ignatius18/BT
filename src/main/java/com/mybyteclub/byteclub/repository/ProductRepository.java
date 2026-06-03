package com.mybyteclub.byteclub.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mybyteclub.byteclub.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
