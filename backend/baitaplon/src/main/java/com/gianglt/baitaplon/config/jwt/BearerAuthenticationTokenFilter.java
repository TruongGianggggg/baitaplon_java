package com.gianglt.baitaplon.config.jwt;

import com.gianglt.baitaplon.model.User;
import com.gianglt.baitaplon.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class BearerAuthenticationTokenFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    // Giữ factory cũ để SecurityConfig không phải đổi
    public static BearerAuthenticationTokenFilter build(org.springframework.security.config.annotation.web.builders.HttpSecurity http) {
        var ctx = http.getSharedObject(org.springframework.context.ApplicationContext.class);
        return new BearerAuthenticationTokenFilter(
                ctx.getBean(JwtUtils.class),
                ctx.getBean(UserRepository.class)
        );
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);

                String email = jwtUtils.extractUsernameFromJWT(token); // verify + check exp
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new BadCredentialsException("User not found"));

                    var authorities = user.getRoles().stream()
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                            .collect(Collectors.toList());

                    // Đặt auth trực tiếp, KHÔNG gọi AuthenticationManager
                    var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            user, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid JWT token");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
