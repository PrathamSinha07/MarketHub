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
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.SellerProfile;
import com.markethub.modules.user.entity.User;
import com.markethub.modules.user.repository.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private User sellerUser;
    private SellerProfile sellerProfile;
    private Category category;
    private final Pageable pageable = PageRequest.of(0, 20);

    @BeforeEach
    void setUp() {
        sellerUser = User.builder()
                .email("seller@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("Seller")
                .role(Role.ROLE_SELLER)
                .build();
        sellerUser.setId(1L);

        sellerProfile = new SellerProfile("Seller Store", "A store", sellerUser);
        sellerProfile.setId(10L);

        category = Category.builder().name("Electronics").slug("electronics").build();
        category.setId(1L);
    }

    private Product productOf(SellerProfile seller, ProductStatus status) {
        return Product.builder()
                .name("Wireless Mouse")
                .slug("wireless-mouse")
                .price(new BigDecimal("19.99"))
                .stockQuantity(5)
                .status(status)
                .seller(seller)
                .category(category)
                .build();
    }

    @Test
    void getProductsForSeller_queriesOnlyResolvedSellerProfile() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findBySellerId(eq(10L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(productOf(sellerProfile, ProductStatus.ACTIVE))));

        List<ProductResponse> results = productService
                .getProductsForSeller(1L, pageable)
                .getContent();

        assertEquals(1, results.size());
        assertEquals(10L, results.get(0).getSellerId());
        verify(productRepository).findBySellerId(eq(10L), any(Pageable.class));
        verify(productRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void getProductsForSeller_includesNonActiveStatuses() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findBySellerId(eq(10L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(
                        productOf(sellerProfile, ProductStatus.DRAFT),
                        productOf(sellerProfile, ProductStatus.ARCHIVED)
                )));

        List<ProductResponse> results = productService
                .getProductsForSeller(1L, pageable)
                .getContent();

        assertEquals(2, results.size());
        assertEquals(ProductStatus.DRAFT, results.get(0).getStatus());
        assertEquals(ProductStatus.ARCHIVED, results.get(1).getStatus());
    }

    @Test
    void getProductsForSeller_userWithoutSellerProfile_throwsBadRequest() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class,
                () -> productService.getProductsForSeller(1L, pageable));

        assertEquals("Invalid seller", exception.getMessage());
        verify(productRepository, never()).findBySellerId(any(), any(Pageable.class));
    }

    @Test
    void getProductsForSeller_neverReturnsAnotherSellersProducts() {
        // The seller id used for the query must come from the profile resolved
        // via the authenticated user id — never from anything the client sent.
        SellerProfile otherSeller = new SellerProfile("Other Store", null, sellerUser);
        otherSeller.setId(99L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findBySellerId(eq(10L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(productOf(sellerProfile, ProductStatus.ACTIVE))));

        List<ProductResponse> results = productService
                .getProductsForSeller(1L, pageable)
                .getContent();

        results.forEach(product -> assertEquals(10L, product.getSellerId()));
        verify(productRepository, never()).findBySellerId(eq(99L), any(Pageable.class));
    }

    private ProductRequest updateRequest(String name, String slug, String price, Integer stock, Long categoryId) {
        return new ProductRequest(name, slug, "Updated description", new BigDecimal(price), stock, categoryId);
    }

    @Test
    void updateProduct_ownProduct_appliesChangesAndKeepsStatus() {
        Product product = productOf(sellerProfile, ProductStatus.ACTIVE);
        product.setId(100L);
        Category newCategory = Category.builder().name("Books").slug("books").build();
        newCategory.setId(2L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(newCategory));
        when(productRepository.save(product)).thenReturn(product);

        ProductResponse response = productService.updateProduct(1L, 100L,
                updateRequest("New Name", "new-name", "29.99", 12, 2L));

        assertEquals("New Name", product.getName());
        assertEquals("new-name", product.getSlug());
        assertEquals(0, new BigDecimal("29.99").compareTo(product.getPrice()));
        assertEquals(12, product.getStockQuantity());
        assertEquals(2L, product.getCategory().getId());
        assertEquals(ProductStatus.ACTIVE, response.getStatus());
        assertEquals(10L, response.getSellerId());
        verify(productRepository).save(product);
    }

    @Test
    void updateProduct_stockOnlyChange_updatesQuantity() {
        Product product = productOf(sellerProfile, ProductStatus.ACTIVE);
        product.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(product)).thenReturn(product);

        ProductResponse response = productService.updateProduct(1L, 100L,
                updateRequest("Wireless Mouse", "wireless-mouse", "19.99", 42, 1L));

        assertEquals(42, response.getStockQuantity());
        assertEquals(ProductStatus.ACTIVE, response.getStatus());
    }

    @Test
    void updateProduct_archivedProduct_staysArchived() {
        // Updates must never flip status — archived products cannot be
        // reactivated through the update endpoint.
        Product product = productOf(sellerProfile, ProductStatus.ARCHIVED);
        product.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(product)).thenReturn(product);

        ProductResponse response = productService.updateProduct(1L, 100L,
                updateRequest("Wireless Mouse", "wireless-mouse", "19.99", 10, 1L));

        assertEquals(ProductStatus.ARCHIVED, response.getStatus());
        assertEquals(ProductStatus.ARCHIVED, product.getStatus());
    }

    @Test
    void updateProduct_anotherSellersProduct_forbiddenAndNotSaved() {
        SellerProfile otherSeller = new SellerProfile("Other Store", null, sellerUser);
        otherSeller.setId(99L);
        Product otherProduct = productOf(otherSeller, ProductStatus.ACTIVE);
        otherProduct.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(otherProduct));

        ApiException exception = assertThrows(ApiException.class, () ->
                productService.updateProduct(1L, 100L,
                        updateRequest("Hijacked", "hijacked", "1.00", 1, 1L)));

        assertEquals("You do not have permission to access this product", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void updateProduct_missingProduct_notFound() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                productService.updateProduct(1L, 999L,
                        updateRequest("Name", "slug", "1.00", 1, 1L)));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void updateProduct_unknownCategory_notFound() {
        Product product = productOf(sellerProfile, ProductStatus.ACTIVE);
        product.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(42L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                productService.updateProduct(1L, 100L,
                        updateRequest("Name", "slug", "1.00", 1, 42L)));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void updateProduct_userWithoutSellerProfile_throwsBadRequest() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () ->
                productService.updateProduct(1L, 100L,
                        updateRequest("Name", "slug", "1.00", 1, 1L)));

        assertEquals("Invalid seller", exception.getMessage());
    }

    @Test
    void archiveProduct_ownProduct_setsArchivedAndSaves() {
        Product product = productOf(sellerProfile, ProductStatus.ACTIVE);
        product.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        productService.archiveProduct(1L, 100L);

        assertEquals(ProductStatus.ARCHIVED, product.getStatus());
        verify(productRepository).save(product);
    }

    @Test
    void archiveProduct_alreadyArchived_isIdempotent() {
        Product product = productOf(sellerProfile, ProductStatus.ARCHIVED);
        product.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        productService.archiveProduct(1L, 100L);

        assertEquals(ProductStatus.ARCHIVED, product.getStatus());
        verify(productRepository).save(product);
    }

    @Test
    void archiveProduct_anotherSellersProduct_forbiddenAndNotSaved() {
        SellerProfile otherSeller = new SellerProfile("Other Store", null, sellerUser);
        otherSeller.setId(99L);
        Product otherProduct = productOf(otherSeller, ProductStatus.ACTIVE);
        otherProduct.setId(100L);

        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(100L)).thenReturn(Optional.of(otherProduct));

        ApiException exception = assertThrows(ApiException.class, () ->
                productService.archiveProduct(1L, 100L));

        assertEquals("You do not have permission to access this product", exception.getMessage());
        assertEquals(ProductStatus.ACTIVE, otherProduct.getStatus());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void archiveProduct_missingProduct_notFound() {
        when(sellerProfileRepository.findByUserId(1L)).thenReturn(Optional.of(sellerProfile));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.archiveProduct(1L, 999L));
        verify(productRepository, never()).save(any(Product.class));
    }
}
