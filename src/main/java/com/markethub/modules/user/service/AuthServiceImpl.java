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
        if (Boolean.TRUE.equals(userRepository.existsByEmail(request.getEmail()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email already registered");
        }

        Role role = request.getRole();
        if (role == Role.ROLE_SELLER) {
            if (!StringUtils.hasText(request.getStoreName())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Store name is required for seller role");
            }
            if (Boolean.TRUE.equals(sellerProfileRepository.existsByStoreName(request.getStoreName()))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Store name already taken");
            }
        }

        User user = User.builder()
                .email(request.getEmail())
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
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
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
}
