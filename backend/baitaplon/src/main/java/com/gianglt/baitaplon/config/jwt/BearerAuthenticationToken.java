package com.gianglt.baitaplon.config.jwt;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@Getter
@Setter(AccessLevel.MODULE)
public class BearerAuthenticationToken extends AbstractAuthenticationToken {
    private final Object principal;   // unauthenticated: String token; authenticated: User
    private final Object credentials;
    private final String token;

    private BearerAuthenticationToken(Object principal) {
        super(null);
        this.principal = principal;   // raw JWT string
        this.credentials = null;
        this.token = null;
        setAuthenticated(false);
    }

    private BearerAuthenticationToken(Object principal, Object credentials,
                                      Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;   // User
        this.credentials = credentials;
        this.token = null;
        super.setAuthenticated(true);
    }

    public static BearerAuthenticationToken authenticated(Object principal, Object credentials,
                                                          Collection<? extends GrantedAuthority> authorities) {
        return new BearerAuthenticationToken(principal, credentials, authorities);
    }

    public static BearerAuthenticationToken unauthenticated(String jwtToken) {
        return new BearerAuthenticationToken(jwtToken);
    }

    @Override
    public void setAuthenticated(boolean authenticated) {
        if (authenticated) {
            throw new IllegalArgumentException("setAuthenticated must be called from constructor");
        }
        super.setAuthenticated(false);
    }
}
