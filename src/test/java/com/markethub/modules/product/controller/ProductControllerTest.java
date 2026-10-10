package com.markethub.modules.product.controller;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.product.dto.ProductResponse;
import com.markethub.modules.product.entity.ProductStatus;
import com.markethub.modules.product.service.ProductService;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import com.markethub.security.CustomUserDetails;
import com.markethub.security.CustomUserDetailsService;
import com.markethub.security.JwtAuthenticationFilter;
import com.markethub.security.JwtService;
import com.markethub.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuthenticationProvider authenticationProvider;

    private Authentication auth(Long id, Role role) {
        User user = User.builder()
                .email(role.name().toLowerCase() + "@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("User")
                .role(role)
                .build();
        user.setId(id);
        CustomUserDetails principal = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private ProductResponse sampleProduct() {
        return new ProductResponse(100L, "Wireless Mouse", "wireless-mouse", "A mouse",
                new BigDecimal("19.99"), 5, ProductStatus.ACTIVE, 10L, "Seller Store", 1L,
                LocalDateTime.of(2026, 10, 6, 12, 0), LocalDateTime.of(2026, 10, 6, 12, 0));
    }

    private String validProductJson() {
        return "{\"name\":\"Updated Mouse\",\"slug\":\"updated-mouse\",\"description\":\"An updated mouse\","
                + "\"price\":24.99,\"stockQuantity\":8,\"categoryId\":1}";
    }

    @Test
    void getSellerProducts_asSeller_usesAuthenticatedUserId() throws Exception {
        when(productService.getProductsForSeller(eq(2L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleProduct())));

        mockMvc.perform(get("/products/seller")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].sellerId").value(10));

        verify(productService).getProductsForSeller(eq(2L), any(Pageable.class));
    }

    @Test
    void getSellerProducts_ignoresClientSuppliedSellerId() throws Exception {
        when(productService.getProductsForSeller(eq(2L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleProduct())));

        mockMvc.perform(get("/products/seller?sellerId=999")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isOk());

        verify(productService).getProductsForSeller(eq(2L), any(Pageable.class));
        verify(productService, never()).getProductsForSeller(eq(999L), any(Pageable.class));
    }

    @Test
    void getSellerProducts_asCustomer_forbidden() throws Exception {
        mockMvc.perform(get("/products/seller")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isForbidden());

        verify(productService, never()).getProductsForSeller(any(), any(Pageable.class));
    }

    @Test
    void getSellerProducts_unauthenticated_rejected() throws Exception {
        mockMvc.perform(get("/products/seller"))
                .andExpect(status().isForbidden());

        verify(productService, never()).getProductsForSeller(any(), any(Pageable.class));
    }

    @Test
    void updateProduct_asSeller_usesAuthenticatedUserId() throws Exception {
        when(productService.updateProduct(eq(2L), eq(100L), any()))
                .thenReturn(sampleProduct());

        mockMvc.perform(put("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100));

        verify(productService).updateProduct(eq(2L), eq(100L), any());
    }

    @Test
    void updateProduct_ignoresSellerIdInBody() throws Exception {
        // Even if a client smuggles a sellerId into the JSON body, ownership
        // must come from the authenticated principal only.
        String jsonWithSellerId = "{\"name\":\"Updated Mouse\",\"slug\":\"updated-mouse\","
                + "\"price\":24.99,\"stockQuantity\":8,\"categoryId\":1,\"sellerId\":999}";
        when(productService.updateProduct(eq(2L), eq(100L), any()))
                .thenReturn(sampleProduct());

        mockMvc.perform(put("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(jsonWithSellerId))
                .andExpect(status().isOk());

        verify(productService).updateProduct(eq(2L), eq(100L), any());
        verify(productService, never()).updateProduct(eq(999L), any(), any());
    }

    @Test
    void updateProduct_asCustomer_forbidden() throws Exception {
        mockMvc.perform(put("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER)))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isForbidden());

        verify(productService, never()).updateProduct(any(), any(), any());
    }

    @Test
    void updateProduct_unauthenticated_rejected() throws Exception {
        mockMvc.perform(put("/products/100")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isForbidden());

        verify(productService, never()).updateProduct(any(), any(), any());
    }

    @Test
    void updateProduct_invalidBody_badRequest() throws Exception {
        String invalidJson = "{\"name\":\"\",\"slug\":\"\",\"price\":-1,\"stockQuantity\":-2,\"categoryId\":null}";

        mockMvc.perform(put("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());

        verify(productService, never()).updateProduct(any(), any(), any());
    }

    @Test
    void updateProduct_otherSellersProduct_forbidden() throws Exception {
        when(productService.updateProduct(eq(2L), eq(100L), any()))
                .thenThrow(new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                        "You do not have permission to access this product"));

        mockMvc.perform(put("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateProduct_missingProduct_notFound() throws Exception {
        when(productService.updateProduct(eq(2L), eq(999L), any()))
                .thenThrow(new ResourceNotFoundException("Product", "id", 999L));

        mockMvc.perform(put("/products/999")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isNotFound());
    }

    @Test
    void archiveProduct_asSeller_usesAuthenticatedUserId() throws Exception {
        mockMvc.perform(delete("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(productService).archiveProduct(2L, 100L);
    }

    @Test
    void archiveProduct_asCustomer_forbidden() throws Exception {
        mockMvc.perform(delete("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER))))
                .andExpect(status().isForbidden());

        verify(productService, never()).archiveProduct(any(), any());
    }

    @Test
    void archiveProduct_unauthenticated_rejected() throws Exception {
        mockMvc.perform(delete("/products/100"))
                .andExpect(status().isForbidden());

        verify(productService, never()).archiveProduct(any(), any());
    }

    @Test
    void archiveProduct_otherSellersProduct_forbidden() throws Exception {
        org.mockito.Mockito.doThrow(new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                        "You do not have permission to access this product"))
                .when(productService).archiveProduct(2L, 100L);

        mockMvc.perform(delete("/products/100")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER))))
                .andExpect(status().isForbidden());
    }
}
