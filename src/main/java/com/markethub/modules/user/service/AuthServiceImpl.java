package com.markethub.modules.user.service;

import com.markethub.common.exception.ApiException;
import com.markethub.modules.user.dto.AuthResponse;
import com.markethub.modules.user.dto.LoginRequest;
import com.markethub.modules.user.dto.RegisterRequest;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.SellerProfile;
import com.markethub.modules.user.entity.User;
import com.markethub.modules.user.repository.SellerProfileRepository;
import com.markethub.modules.user.repository.UserRepository;
import com.markethub.security.CustomUserDetails;
import com.markethub.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(
            UserRepository userRepository,
            SellerProfileRepository sellerProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Emails are stored and compared case-insensitively: Bob@Example.com
        // and bob@example.com are the same account, and the user can sign in
        // with any casing.
        String email = normalizeEmail(request.getEmail());

        // BCrypt silently truncates input longer than 72 *bytes*; reject such
        // passwords up front instead of hashing only a prefix of them.
        if (request.getPassword() != null
                && request.getPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Password must be at most 72 bytes long");
        }

        if (Boolean.TRUE.equals(userRepository.existsByEmail(email))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email already registered");
        }

        Role role = request.getRole();

        // Admin accounts must never be created through the public signup
        // endpoint - otherwise anyone could grant themselves admin rights.
        if (role != Role.ROLE_CUSTOMER && role != Role.ROLE_SELLER) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only customer and seller accounts can be registered");
        }

        if (role == Role.ROLE_SELLER) {
            if (!StringUtils.hasText(request.getStoreName())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Store name is required for seller role");
            }
            if (Boolean.TRUE.equals(sellerProfileRepository.existsByStoreName(request.getStoreName()))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Store name already taken");
            }
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .enabled(true)
                .build();

        if (role == Role.ROLE_SELLER) {
            SellerProfile sellerProfile = SellerProfile.builder()
                    .storeName(request.getStoreName())
                    .storeDescription(request.getStoreDescription())
                    .user(user)
                    .build();
            user.setSellerProfile(sellerProfile);
        }

        User savedUser = userRepository.save(user);
        CustomUserDetails userDetails = new CustomUserDetails(savedUser);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .userId(savedUser.getId())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    /** Emails are case-insensitive; store and look up a single canonical form. */
    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
