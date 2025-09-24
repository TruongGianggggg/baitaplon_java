package com.gianglt.baitaplon.config.jwt;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.crypto.ECDSAVerifier;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.SneakyThrows;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class JwtUtils {
    private static final ECKey EC_KEY;
    private static final long EXP_MILLIS = 3600_000L; // 1h

    static {
        try {
            EC_KEY = new ECKeyGenerator(Curve.P_256)
                    .keyUse(KeyUse.SIGNATURE)
                    .keyID(UUID.randomUUID().toString())
                    .generate();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    public String generateJWT(String username) {
        return generateJWT(username, null);
    }

    public String generateJWT(String username, List<String> roles) {
        try {
            var header = new JWSHeader.Builder(JWSAlgorithm.ES256)
                    .type(JOSEObjectType.JWT)
                    .jwk(EC_KEY.toPublicJWK())
                    .build();

            var now = new Date();
            var exp = new Date(now.getTime() + EXP_MILLIS);

            var builder = new JWTClaimsSet.Builder()
                    .subject(username)
                    .claim("email", username)
                    .issuer("http://localhost:8080")
                    .jwtID(UUID.randomUUID().toString())
                    .issueTime(now)
                    .notBeforeTime(now)
                    .expirationTime(exp);

            if (roles != null && !roles.isEmpty()) {
                builder.claim("roles", roles);
            }

            var claims = builder.build();
            var jwt = new SignedJWT(header, claims);
            jwt.sign(new ECDSASigner(EC_KEY));
            return jwt.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate JWT", e);
        }
    }

    @SneakyThrows
    public String extractUsernameFromJWT(String token) {
        var signed = SignedJWT.parse(token);
        var verifier = new ECDSAVerifier(EC_KEY.toECPublicKey());
        if (!signed.verify(verifier)) {
            throw new BadCredentialsException("Invalid JWT signature");
        }
        var claims = signed.getJWTClaimsSet();
        var exp = claims.getExpirationTime();
        if (exp == null || exp.before(new Date())) {
            throw new BadCredentialsException("JWT expired");
        }
        return claims.getSubject();
    }
}
