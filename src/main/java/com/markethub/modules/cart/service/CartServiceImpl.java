package com.markethub.modules.cart.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.cart.dto.AddToCartRequest;
import com.markethub.modules.cart.dto.CartItemResponse;
import com.markethub.modules.cart.dto.CartResponse;
import com.markethub.modules.cart.dto.UpdateCartItemRequest;
import com.markethub.modules.cart.entity.Cart;
import com.markethub.modules.cart.entity.CartItem;
import com.markethub.modules.cart.repository.CartItemRepository;
import com.markethub.modules.cart.repository.CartRepository;
import com.markethub.modules.product.entity.Product;
import com.markethub.modules.product.entity.ProductStatus;
import com.markethub.modules.product.repository.ProductRepository;
import com.markethub.modules.user.entity.User;
import com.markethub.modules.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns the customer's cart, creating an empty one on first access.
     *
     * A customer who has never added an item still gets a valid empty cart
     * instead of a 404, so the cart page and navbar count can render their
     * normal empty state.
     */
    @Override
    @Transactional
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Quantity must be greater than 0");
        }

        Cart cart = getOrCreateCart(userId);
        Product product = getProduct(request.getProductId());
        validateProductAvailable(product);

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            validateStock(product, newQuantity);
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            validateStock(product, request.getQuantity());
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();
            cart.getItems().add(item);
            cartItemRepository.save(item);
        }

        return toResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Quantity must be greater than 0");
        }

        CartItem item = getCartItem(cartItemId);
        verifyItemBelongsToUser(item, userId);
        // Same availability rule as addToCart: an item whose product has since
        // been archived/drafted/out-of-stock must not be grown in the cart.
        validateProductAvailable(item.getProduct());
        validateStock(item.getProduct(), request.getQuantity());

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return toResponse(item.getCart());
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long cartItemId) {
        CartItem item = getCartItem(cartItemId);
        verifyItemBelongsToUser(item, userId);

        Cart cart = item.getCart();
        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return toResponse(cartRepository.save(cart));
    }

    @Override
    @Transactional
    public CartResponse clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        // `items` has orphanRemoval = true, so clearing the collection removes
        // the rows; an explicit deleteAll here would double-delete the same
        // managed entities.
        cart.getItems().clear();
        cartRepository.save(cart);
        return toResponse(cart);
    }

    private Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));
    }

    private Cart getOrCreateCart(Long userId) {
        Cart existing = cartRepository.findByUserId(userId).orElse(null);
        if (existing != null) {
            return existing;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        // If two concurrent first-time requests race to create the
        // one-cart-per-user row, the loser hits the unique constraint and
        // receives a clean 409 (see GlobalExceptionHandler) instead of a 500.
        return cartRepository.save(Cart.builder().user(user).items(new ArrayList<>()).build());
    }

    private Product getProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private CartItem getCartItem(Long cartItemId) {
        return cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));
    }

    private void validateProductAvailable(Product product) {
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Product is not available for purchase");
        }
    }

    private void validateStock(Product product, int requestedQuantity) {
        if (requestedQuantity > product.getStockQuantity()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Requested quantity exceeds available stock");
        }
    }

    private void verifyItemBelongsToUser(CartItem item, Long userId) {
        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to modify this cart item");
        }
    }

    private CartResponse toResponse(Cart cart) {
        // Prices are rendered from the product's *current* price, not the
        // add-time snapshot, so the cart total always matches what checkout
        // will actually charge (checkout re-reads the live price).
        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> new CartItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getProduct().getPrice(),
                        item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                ))
                .toList();

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(cart.getId(), items, subtotal);
    }
}
