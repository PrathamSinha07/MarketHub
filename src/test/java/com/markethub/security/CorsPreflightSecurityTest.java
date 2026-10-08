package com.markethub.security;

import com.markethub.modules.product.controller.CategoryController;
import com.markethub.modules.product.controller.ProductController;
import com.markethub.modules.product.dto.ProductRequest;
import com.markethub.modules.product.dto.ProductResponse;
import com.markethub.modules.product.entity.ProductStatus;
import com.markethub.modules.product.service.CategoryService;
import com.markethub.modules.product.service.ProductService;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression test for CORS preflight handling.
 *
 * <p>The frontend on http://localhost:3000 attaches an Authorization header to its
 * requests. Before such a cross-origin request the browser sends an OPTIONS preflight
 * that never carries credentials. Spring Security must permit OPTIONS requests, while
 * the actual endpoints stay behind their existing authentication and role rules.</p>
 */
@WebMvcTest(controllers = {ProductController.class, CategoryController.class}, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class CorsPreflightSecurityTest {

    private static final String FRONTEND_ORIGIN = "http://localhost:3000";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private CategoryService categoryService;

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

    private MockHttpServletRequestBuilder preflight(String path, String requestMethod) {
        return options(path)
                .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, requestMethod)
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization");
    }

    private String validProductJson() {
        return "{\"name\":\"Test Product\",\"slug\":\"test-product\",\"description\":\"A product\","
                + "\"price\":19.99,\"stockQuantity\":5,\"categoryId\":1}";
    }

    private ProductResponse sampleProduct() {
        return new ProductResponse(100L, "Test Product", "test-product", "A product",
                new BigDecimal("19.99"), 5, ProductStatus.ACTIVE, 2L, "seller@example.com", 1L,
                LocalDateTime.of(2026, 10, 6, 12, 0), LocalDateTime.of(2026, 10, 6, 12, 0));
    }

    @Test
    void preflightGet_products_allowedWithoutAuthentication() throws Exception {
        mockMvc.perform(preflight("/products", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void preflightGet_categories_allowedWithoutAuthentication() throws Exception {
        mockMvc.perform(preflight("/categories", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void preflightPost_products_allowedWithoutAuthentication() throws Exception {
        mockMvc.perform(preflight("/products", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void preflight_disallowedOrigin_stillRejected() throws Exception {
        mockMvc.perform(options("/products")
                        .header(HttpHeaders.ORIGIN, "http://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getProducts_unauthenticated_stillPublic() throws Exception {
        when(productService.getActiveProducts(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getCategories_unauthenticated_stillPublic() throws Exception {
        when(categoryService.getRootCategories()).thenReturn(List.of());

        mockMvc.perform(get("/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getProducts_withValidBearerToken_isOk() throws Exception {
        CustomUserDetails principal = (CustomUserDetails) auth(2L, Role.ROLE_SELLER).getPrincipal();
        when(jwtService.extractUsername("valid-token")).thenReturn("seller@example.com");
        when(customUserDetailsService.loadUserByUsername("seller@example.com")).thenReturn(principal);
        when(jwtService.isTokenValid(eq("valid-token"), any(UserDetails.class))).thenReturn(true);
        when(productService.getActiveProducts(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void postProducts_unauthenticated_forbidden() throws Exception {
        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void postProducts_asCustomer_forbidden() throws Exception {
        mockMvc.perform(post("/products")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(1L, Role.ROLE_CUSTOMER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void postProducts_asSeller_created() throws Exception {
        when(productService.createProduct(eq(2L), any(ProductRequest.class))).thenReturn(sampleProduct());

        mockMvc.perform(post("/products")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(auth(2L, Role.ROLE_SELLER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validProductJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(productService).createProduct(eq(2L), any(ProductRequest.class));
    }
}
