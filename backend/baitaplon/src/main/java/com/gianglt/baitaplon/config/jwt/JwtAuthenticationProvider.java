package com.gianglt.baitaplon.config.jwt;

import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationProvider implements AuthenticationProvider {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    @Override
    public Authentication authenticate(Authentication authentication) {
        var bearer = (BearerAuthenticationToken) authentication;
        var token = (String) bearer.getPrincipal();

        String username = jwtUtils.extractUsernameFromJWT(token);
        User user = userService.findByEmail(username)
                .orElseThrow(() -> new BadCredentialsException("Token not found or expired"));

        var role = user.getRoles().stream()
                .findFirst()
                .orElseThrow(() -> new BadCredentialsException("User has no role"));

        var auth = new SimpleGrantedAuthority("ROLE_" + role.name());
        return BearerAuthenticationToken.authenticated(user, null, Collections.singletonList(auth));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return BearerAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
