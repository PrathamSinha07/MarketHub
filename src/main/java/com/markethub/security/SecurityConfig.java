package com.markethub.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.markethub.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final ObjectMapper objectMapper;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            AuthenticationProvider authenticationProvider,
            ObjectMapper objectMapper
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Deployment health checks must work without a token; only
                // health and info are exposed (see application.yml).
                .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/auth/**", "/api/v1/auth/**", "/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/payments/webhook", "/api/v1/payments/webhook").permitAll()
                .requestMatchers("/payments/**", "/api/v1/payments/**").hasAuthority("ROLE_CUSTOMER")
                .requestMatchers(HttpMethod.GET, "/api/v1/products", "/products", "/api/v1/products/*", "/products/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories", "/categories", "/api/v1/categories/**", "/categories/**").permitAll()
                .requestMatchers("/api/v1/cart/**", "/cart/**").hasAuthority("ROLE_CUSTOMER")
                .anyRequest().authenticated()
            )
            // Spring Security's defaults answer 403 (with the framework's own
            // error body) for both "not logged in" and "not allowed". Answer in
            // the app's ApiResponse envelope instead: 401 when there is no valid
            // JWT, 403 when the caller is authenticated but lacks the authority.
            .exceptionHandling(handling -> handling
                .authenticationEntryPoint(authenticationEntryPoint())
                .accessDeniedHandler(accessDeniedHandler())
            );

        return http.build();
    }

    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) ->
                writeError(response, HttpStatus.UNAUTHORIZED,
                        "You must sign in to perform this action");
    }

    private AccessDeniedHandler accessDeniedHandler() {
        return (HttpServletRequest request, HttpServletResponse response, org.springframework.security.access.AccessDeniedException accessDeniedException) ->
                writeError(response, HttpStatus.FORBIDDEN,
                        "You do not have permission to perform this action");
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.error(message));
    }
}
