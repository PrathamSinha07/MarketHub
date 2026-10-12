package com.markethub.modules.product.service;

import com.markethub.modules.product.dto.ProductRequest;
import com.markethub.modules.product.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    ProductResponse createProduct(Long userId, ProductRequest request);

    ProductResponse getProductById(Long productId, Long requesterUserId);

    Page<ProductResponse> getActiveProducts(Long categoryId, String search, Pageable pageable);

    Page<ProductResponse> getProductsForSeller(Long userId, Pageable pageable);

    ProductResponse updateProduct(Long userId, Long productId, ProductRequest request);

    void archiveProduct(Long userId, Long productId);
}
