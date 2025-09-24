package com.gianglt.baitaplon.config;

import com.gianglt.baitaplon.config.jwt.BearerAuthenticationTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(c -> c.configurationSource(corsConfig()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers(HttpMethod.POST, "/api/users/register", "/api/users/login").permitAll()
                        .requestMatchers(HttpMethod.GET,"/api/users/{id}").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.PUT, "/api/users/{id}").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.GET,"/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/{id}").hasRole("ADMIN")


                        .requestMatchers(HttpMethod.GET,"/api/products").permitAll()
                        .requestMatchers(HttpMethod.GET,"/api/products/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/{id}").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/cart").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/cart/add").hasRole("USER")
                        .requestMatchers(HttpMethod.PUT, "/api/cart/update").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/cart/remove").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE,"/api/cart/clear").hasRole("USER")

                        .requestMatchers(HttpMethod.POST,"/api/categories").permitAll()
                        .requestMatchers(HttpMethod.PUT,"/api/categories/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,"/api/categories/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,"/api/categories/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET,"/api/categories").permitAll()

                        .requestMatchers(HttpMethod.GET,"/api/coupons").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST,"/api/coupons").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,"/api/coupons/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,"/api/coupons/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,"/api/coupons/{id}").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.POST,"/api/coupons/preview").hasAnyRole("ADMIN","USER")

                        .requestMatchers(HttpMethod.GET,"/api/orders/user/{userId}").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.POST,"/api/orders/checkout").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.GET,"/api/orders/{id}").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.GET,"/api/orders").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET,"/api/payments/vnpay-return").permitAll()
                        .requestMatchers(HttpMethod.GET,"/api/payments/vnpay-ipn").permitAll()

                        .requestMatchers(HttpMethod.GET,"/api/payments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,"/api/payments/{id}").hasAnyRole("ADMIN","USER")
                        .requestMatchers(HttpMethod.GET,"/api/payments/me").hasRole("USER")
                        .requestMatchers("/uploads/**").permitAll()

                        .anyRequest().denyAll()
                )
                .addFilterBefore(BearerAuthenticationTokenFilter.build(http), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private CorsConfigurationSource corsConfig() {
        var c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("http://localhost:4200"));
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type"));
        c.setAllowCredentials(true);
        var s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }
}
