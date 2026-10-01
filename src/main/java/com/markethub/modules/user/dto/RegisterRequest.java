package com.markethub.modules.user.dto;

import com.markethub.modules.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private Role role = Role.ROLE_CUSTOMER;

    private String storeName;

    private String storeDescription;

    public RegisterRequest() {
    }

    public RegisterRequest(String email, String password, String firstName, String lastName, Role role, String storeName, String storeDescription) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role != null ? role : Role.ROLE_CUSTOMER;
        this.storeName = storeName;
        this.storeDescription = storeDescription;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Role getRole() {
        return role != null ? role : Role.ROLE_CUSTOMER;
    }

    public void setRole(Role role) {
        this.role = role;
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

    public static RegisterRequestBuilder builder() {
        return new RegisterRequestBuilder();
    }

    public static class RegisterRequestBuilder {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private Role role = Role.ROLE_CUSTOMER;
        private String storeName;
        private String storeDescription;

        public RegisterRequestBuilder email(String email) {
            this.email = email;
            return this;
        }

        public RegisterRequestBuilder password(String password) {
            this.password = password;
            return this;
        }

        public RegisterRequestBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public RegisterRequestBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public RegisterRequestBuilder role(Role role) {
            this.role = role;
            return this;
        }

        public RegisterRequestBuilder storeName(String storeName) {
            this.storeName = storeName;
            return this;
        }

        public RegisterRequestBuilder storeDescription(String storeDescription) {
            this.storeDescription = storeDescription;
            return this;
        }

        public RegisterRequest build() {
            return new RegisterRequest(email, password, firstName, lastName, role, storeName, storeDescription);
        }
    }
}
