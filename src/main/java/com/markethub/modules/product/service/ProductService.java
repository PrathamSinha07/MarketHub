package com.markethub.modules.product.service;

import com.markethub.modules.product.dto.ProductRequest;
import com.markethub.modules.product.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    ProductResponse createProduct(Long userId, ProductRequest request);

    ProductResponse getProductById(Long productId);

    Page<ProductResponse> getActiveProducts(Long categoryId, Pageable pageable);

    ProductResponse updateProduct(Long userId, Long productId, ProductRequest request);

    void archiveProduct(Long userId, Long productId);
}
