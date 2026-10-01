package com.markethub.modules.user.service;

import com.markethub.modules.user.dto.AuthResponse;
import com.markethub.modules.user.dto.LoginRequest;
import com.markethub.modules.user.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
