package com.gianglt.baitaplon.config;

import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class UsernamePasswordAuthenticationProvider implements AuthenticationProvider {

    private final UserRepository userRepository;

    @Override
    public Authentication authenticate(Authentication authentication) {
        String username = authentication.getName(); // email
        String password = String.valueOf(authentication.getCredentials());

        User user = userRepository.findByEmail(username).orElse(null);
        if (user == null || user.getPassword() == null || !password.equals(user.getPassword())) {
            throw new BadCredentialsException("Username or password is incorrect");
        }

        var role = user.getRoles().stream()
                .findFirst()
                .orElseThrow(() -> new BadCredentialsException("User has no role"));

        var authority = new SimpleGrantedAuthority("ROLE_" + role.name());
        return new UsernamePasswordAuthenticationToken(user, null, Collections.singleton(authority));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
