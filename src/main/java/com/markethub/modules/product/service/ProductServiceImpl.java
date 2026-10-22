package com.markethub.modules.product.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.product.dto.ProductRequest;
import com.markethub.modules.product.dto.ProductResponse;
import com.markethub.modules.product.entity.Category;
import com.markethub.modules.product.entity.Product;
import com.markethub.modules.product.entity.ProductStatus;
import com.markethub.modules.product.repository.CategoryRepository;
import com.markethub.modules.product.repository.ProductRepository;
import com.markethub.modules.user.entity.SellerProfile;
import com.markethub.modules.user.repository.SellerProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.JoinType;
import java.util.Locale;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerProfileRepository sellerProfileRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SellerProfileRepository sellerProfileRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.sellerProfileRepository = sellerProfileRepository;
    }

    @Override
    @Transactional
    public ProductResponse createProduct(Long userId, ProductRequest request) {
        SellerProfile sellerProfile = getSellerProfile(userId);
        Category category = getCategory(request.getCategoryId());

        Product product = Product.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .status(ProductStatus.ACTIVE)
                .seller(sellerProfile)
                .category(category)
                .build();

        Product savedProduct = productRepository.save(product);
        return toResponse(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long productId, Long requesterUserId) {
        Product product = getProduct(productId);

        // DRAFT and ARCHIVED products are only visible to their owner;
        // everyone else gets the same 404 as a missing id, so hidden
        // listings cannot be probed for.
        if (!isPubliclyVisible(product) && !isOwner(product, requesterUserId)) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }
        return toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getActiveProducts(Long categoryId, String search, Pageable pageable) {
        Specification<Product> spec =
                (root, query, cb) -> cb.equal(root.get("status"), ProductStatus.ACTIVE);

        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId));
        }

        String term = search == null ? "" : search.trim();
        if (!term.isEmpty()) {
            // Escape LIKE wildcards so a search for "100%" or "a_c" matches
            // those literals instead of acting as a pattern.
            String escaped = term
                    .replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");
            String pattern = "%" + escaped.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern, '\\'),
                    cb.like(cb.lower(root.get("description")), pattern, '\\'),
                    cb.like(cb.lower(root.get("slug")), pattern, '\\'),
                    cb.like(cb.lower(root.join("seller", JoinType.INNER).get("storeName")), pattern, '\\')));
        }

        return productRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsForSeller(Long userId, Pageable pageable) {
        SellerProfile sellerProfile = getSellerProfile(userId);
        Page<Product> products = productRepository.findBySellerId(sellerProfile.getId(), pageable);
        return products.map(this::toResponse);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long userId, Long productId, ProductRequest request) {
        SellerProfile sellerProfile = getSellerProfile(userId);
        Product product = getProduct(productId);
        verifyOwnership(product, sellerProfile);
        Category category = getCategory(request.getCategoryId());

        product.setName(request.getName());
        product.setSlug(request.getSlug());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(category);

        Product updatedProduct = productRepository.save(product);
        return toResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void archiveProduct(Long userId, Long productId) {
        SellerProfile sellerProfile = getSellerProfile(userId);
        Product product = getProduct(productId);
        verifyOwnership(product, sellerProfile);

        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);
    }

    private SellerProfile getSellerProfile(Long userId) {
        return sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid seller"));
    }

    private Product getProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private Category getCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
    }

    private void verifyOwnership(Product product, SellerProfile sellerProfile) {
        if (!product.getSeller().getId().equals(sellerProfile.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to access this product");
        }
    }

    /** ACTIVE and OUT_OF_STOCK products are listed publicly; DRAFT/ARCHIVED are not. */
    private boolean isPubliclyVisible(Product product) {
        return product.getStatus() == ProductStatus.ACTIVE
                || product.getStatus() == ProductStatus.OUT_OF_STOCK;
    }

    /** True when the requesting user owns the product (seller-side management). */
    private boolean isOwner(Product product, Long requesterUserId) {
        return requesterUserId != null
                && product.getSeller() != null
                && product.getSeller().getUser() != null
                && requesterUserId.equals(product.getSeller().getUser().getId());
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getStatus(),
                product.getSeller().getId(),
                product.getSeller().getStoreName(),
                product.getCategory().getId(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
