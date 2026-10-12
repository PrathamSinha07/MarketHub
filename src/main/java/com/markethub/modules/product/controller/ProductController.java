package com.markethub.modules.product.controller;

import com.markethub.common.response.ApiResponse;
import com.markethub.modules.product.dto.ProductRequest;
import com.markethub.modules.product.dto.ProductResponse;
import com.markethub.modules.product.service.ProductService;
import com.markethub.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequestMapping("/products")
public class ProductController {

    /** Upper bound for `size` so a single request cannot page the whole table. */
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ProductRequest request
    ) {
        ProductResponse response = productService.createProduct(userDetails.getUser().getId(), request);
        return new ResponseEntity<>(ApiResponse.success(response, "Product created successfully"), HttpStatus.CREATED);
    }

    /**
     * Public catalog listing.
     *
     * `search` runs server-side against name, description, slug and store
     * name; `sortBy` is a whitelist of safe orders (unknown values fall back
     * to newest-first) so a malformed sort can never surface as a 500.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getActiveProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), resolveSort(sortBy));
        Page<ProductResponse> response = productService.getActiveProducts(categoryId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Products retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long requesterUserId = userDetails != null ? userDetails.getUser().getId() : null;
        ProductResponse response = productService.getProductById(id, requesterUserId);
        return ResponseEntity.ok(ApiResponse.success(response, "Product retrieved successfully"));
    }

    @GetMapping("/seller")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getSellerProducts(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), resolveSort(sortBy));
        Page<ProductResponse> response = productService.getProductsForSeller(userDetails.getUser().getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Seller products retrieved successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        ProductResponse response = productService.updateProduct(userDetails.getUser().getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SELLER')")
    public ResponseEntity<ApiResponse<Void>> archiveProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        productService.archiveProduct(userDetails.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product archived successfully"));
    }

    private static int clampSize(int size) {
        if (size < 1) {
            return 20;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    /** Whitelisted sort orders; anything unknown falls back to newest first. */
    private static Sort resolveSort(String sortBy) {
        String key = sortBy == null ? "" : sortBy.trim().toLowerCase(Locale.ROOT);
        Sort tieBreaker = Sort.by(Sort.Direction.DESC, "id");
        Sort sort = switch (key) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        return sort.and(tieBreaker);
    }
}
