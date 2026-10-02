package com.markethub.modules.product.service;

import com.markethub.modules.product.dto.ProductRequest;
import com.markethub.modules.product.dto.ProductResponse;

public interface ProductService {

    ProductResponse createProduct(Long userId, ProductRequest request);

    ProductResponse getProductById(Long productId);

    ProductResponse updateProduct(Long userId, Long productId, ProductRequest request);

    void archiveProduct(Long userId, Long productId);
}
