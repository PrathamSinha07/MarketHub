package com.markethub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.net.URI;
import java.util.Locale;

/**
 * Fails startup when the `prod` profile is active but the configuration is
 * still the developer default or a copy of the shipped example file.
 *
 * Deliberately strict: an application that boots with example credentials or
 * a wildcard CORS policy looks healthy while being remotely exploitable, and
 * the mistake is otherwise only discovered after deployment.
 *
 * No secret value is ever logged - messages name the variable, never its
 * content.
 */
@Configuration
@Profile("prod")
public class ProductionStartupValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionStartupValidator.class);

    /** Prefix used by every placeholder in `.env.example`. */
    private static final String EXAMPLE_PLACEHOLDER = "change-me";

    public ProductionStartupValidator(
            @Value("${cors.allowed-origins}") String allowedOrigins,
            @Value("${application.security.jwt.secret-key}") String jwtSecret,
            @Value("${spring.datasource.password}") String dbPassword,
            @Value("${spring.datasource.url}") String dbUrl
    ) {
        validateCors(allowedOrigins);
        validateSecret("JWT_SECRET", jwtSecret);
        validateSecret("DB_PASSWORD", dbPassword);

        if (dbUrl != null && dbUrl.contains("localhost")) {
            log.warn("DB_URL points at localhost ({}). That is only correct when "
                    + "PostgreSQL runs in the same network namespace as the application.", safeHost(dbUrl));
        }
    }

    private void validateCors(String allowedOrigins) {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            throw new IllegalStateException(
                    "CORS_ALLOWED_ORIGINS must list the frontend origin(s) when the prod profile is active "
                            + "(e.g. CORS_ALLOWED_ORIGINS=https://www.example.com)");
        }

        for (String raw : allowedOrigins.split(",")) {
            String origin = raw.trim();
            if (origin.isEmpty()) {
                continue;
            }
            if (origin.contains("*")) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS must not contain wildcards in production; "
                                + "list each exact frontend origin instead (found: " + origin + ")");
            }

            URI uri = parseOrigin(origin);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!"https".equals(scheme)) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS entries must be https:// origins in production (found: "
                                + origin + "). Terminate TLS in front of the frontend and pass its public origin.");
            }
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            if (host.equals("localhost") || host.startsWith("localhost.") || host.equals("127.0.0.1")) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS is still the local development value (" + origin
                                + "). Set it to the deployed frontend origin.");
            }
        }
    }

    private static URI parseOrigin(String origin) {
        try {
            URI uri = new URI(origin);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS entry is not a valid origin (scheme://host[:port]): " + origin);
            }
            return uri;
        } catch (java.net.URISyntaxException e) {
            throw new IllegalStateException(
                    "CORS_ALLOWED_ORIGINS entry is not a valid origin: " + origin, e);
        }
    }

    /** Rejects the example values shipped in `.env.example` if they were copied verbatim. */
    private void validateSecret(String variable, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(variable + " must not be empty when the prod profile is active");
        }
        if (value.toLowerCase(Locale.ROOT).startsWith(EXAMPLE_PLACEHOLDER)) {
            throw new IllegalStateException(
                    variable + " is still the example placeholder from .env.example; generate a real value "
                            + "before starting in production");
        }
    }

    /**
     * Returns only the host portion of a JDBC URL so a warning never carries
     * credentials (JDBC URLs may embed user:password@).
     */
    private static String safeHost(String jdbcUrl) {
        try {
            int at = jdbcUrl.lastIndexOf('@');
            int slash = jdbcUrl.indexOf("//", at < 0 ? 0 : at);
            if (slash < 0) {
                return "<unparseable>";
            }
            String after = jdbcUrl.substring(slash + 2);
            int end = Math.min(Math.min(after.indexOf('/'), after.indexOf('?')), after.length());
            String hostPart = end <= 0 ? after : after.substring(0, end);
            int colon = hostPart.indexOf(':');
            return colon < 0 ? hostPart : hostPart.substring(0, colon);
        } catch (RuntimeException e) {
            return "<unparseable>";
        }
    }
}
