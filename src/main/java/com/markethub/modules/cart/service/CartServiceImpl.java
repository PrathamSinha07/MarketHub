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

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = getCartByUserId(userId);
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
        cart.getItems().clear();
        cartItemRepository.deleteAll(cartItemRepository.findByCartId(cart.getId()));
        cartRepository.save(cart);
        return toResponse(cart);
    }

    private Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));
    }

    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    return cartRepository.save(Cart.builder().user(user).build());
                });
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
        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> new CartItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                ))
                .toList();

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(cart.getId(), items, subtotal);
    }
}
