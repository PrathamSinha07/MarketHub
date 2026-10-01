package com.markethub.modules.user.entity;

import com.markethub.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "seller_profiles")
public class SellerProfile extends BaseEntity {

    @Column(name = "store_name", nullable = false, unique = true)
    private String storeName;

    @Column(name = "store_description", columnDefinition = "TEXT")
    private String storeDescription;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    public SellerProfile() {
    }

    public SellerProfile(String storeName, String storeDescription, User user) {
        this.storeName = storeName;
        this.storeDescription = storeDescription;
        this.user = user;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getStoreDescription() {
        return storeDescription;
    }

    public void setStoreDescription(String storeDescription) {
        this.storeDescription = storeDescription;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public static SellerProfileBuilder builder() {
        return new SellerProfileBuilder();
    }

    public static class SellerProfileBuilder {
        private String storeName;
        private String storeDescription;
        private User user;

        public SellerProfileBuilder storeName(String storeName) {
            this.storeName = storeName;
            return this;
        }

        public SellerProfileBuilder storeDescription(String storeDescription) {
            this.storeDescription = storeDescription;
            return this;
        }

        public SellerProfileBuilder user(User user) {
            this.user = user;
            return this;
        }

        public SellerProfile build() {
            return new SellerProfile(storeName, storeDescription, user);
        }
    }
}
