package com.markethub.modules.cart.repository;

import com.markethub.modules.cart.entity.Cart;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUserId(Long userId);

    Boolean existsByUserId(Long userId);

    /**
     * Row-locked read of a customer's cart. Checkout locks the cart first so
     * two simultaneous "Place order" submissions from the same customer are
     * serialised: the second one waits, then finds an empty cart and is
     * rejected with a 400 instead of creating a duplicate order.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cart c where c.user.id = :userId")
    Optional<Cart> findByUserIdForUpdate(@Param("userId") Long userId);
}
