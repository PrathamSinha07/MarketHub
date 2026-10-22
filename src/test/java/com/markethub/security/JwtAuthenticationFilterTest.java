package com.markethub.security;

import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

/**
 * The filter is the last line of defence for account disabling: a token minted
 * before an account was disabled must stop working immediately, not when the
 * token expires.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private User user(boolean enabled) {
        return User.builder()
                .email("someone@example.com")
                .password("hash")
                .firstName("Some")
                .lastName("One")
                .role(Role.ROLE_CUSTOMER)
                .enabled(enabled)
                .build();
    }

    private void runFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer test-token");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
    }

    @Test
    void validTokenForEnabledUser_authenticates() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn("someone@example.com");
        when(userDetailsService.loadUserByUsername("someone@example.com"))
                .thenReturn(new CustomUserDetails(user(true)));
        when(jwtService.isTokenValid(org.mockito.ArgumentMatchers.eq("test-token"),
                org.mockito.ArgumentMatchers.any())).thenReturn(true);

        runFilter();

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void validTokenForDisabledUser_isRejected() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn("someone@example.com");
        when(userDetailsService.loadUserByUsername("someone@example.com"))
                .thenReturn(new CustomUserDetails(user(false)));

        runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void expiredToken_isRejected() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn("someone@example.com");
        when(userDetailsService.loadUserByUsername("someone@example.com"))
                .thenReturn(new CustomUserDetails(user(true)));
        when(jwtService.isTokenValid(org.mockito.ArgumentMatchers.eq("test-token"),
                org.mockito.ArgumentMatchers.any())).thenReturn(false);

        runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void noAuthHeader_passesThroughUnauthenticated() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void unknownUserInToken_isRejected() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn("ghost@example.com");
        when(userDetailsService.loadUserByUsername("ghost@example.com"))
                .thenThrow(new org.springframework.security.core.userdetails.UsernameNotFoundException("ghost"));

        runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void missingUserLookupResult_isRejected() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn("someone@example.com");
        when(userDetailsService.loadUserByUsername("someone@example.com")).thenReturn(null);

        runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void tokenValidityIsNeverCheckedForDisabledUsers() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn("someone@example.com");
        when(userDetailsService.loadUserByUsername("someone@example.com"))
                .thenReturn(new CustomUserDetails(user(false)));

        runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        // isEnabled() is the gate; validity must not even be consulted.
        org.mockito.Mockito.verify(jwtService, org.mockito.Mockito.never())
                .isTokenValid(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void extractUsernameReturningNull_authenticatesNothing() throws Exception {
        when(jwtService.extractUsername("test-token")).thenReturn(null);

        runFilter();

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
