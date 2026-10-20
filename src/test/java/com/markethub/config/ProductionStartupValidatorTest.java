package com.markethub.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Startup validation for the `prod` profile.
 *
 * The checks must fail loudly (so an insecure deployment never comes up) and
 * the resulting messages must never contain a credential value.
 */
class ProductionStartupValidatorTest {

    private static final String HTTPS_ORIGIN = "https://shop.example.com";
    private static final String EXAMPLE_SECRET = "change-me-to-a-random-32+-byte-secret";
    private static final String EXAMPLE_PASSWORD = "change-me";
    private static final String DB_URL = "jdbc:postgresql://db.internal:5432/markethub";

    private void validate(String origins, String jwtSecret, String dbPassword) {
        new ProductionStartupValidator(origins, jwtSecret, dbPassword, DB_URL);
    }

    @Test
    void validConfiguration_starts() {
        assertDoesNotThrow(() -> validate(
                HTTPS_ORIGIN, "a-real-generated-secret-value", "a-real-database-password"));
    }

    @Test
    void multipleHttpsOrigins_start() {
        assertDoesNotThrow(() -> validate(
                HTTPS_ORIGIN + ", https://admin.example.com", "a-real-secret", "a-real-password"));
    }

    @Test
    void localhostOrigin_rejected() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> validate("http://localhost:3000", "a-real-secret", "a-real-password"));
        assertTrueMessage(ex, "CORS_ALLOWED_ORIGINS");
    }

    @Test
    void localhostHttpsOrigin_rejected() {
        assertThrows(IllegalStateException.class,
                () -> validate("https://localhost:3000", "a-real-secret", "a-real-password"));
    }

    @Test
    void wildcardOrigin_rejected() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> validate("https://*.example.com", "a-real-secret", "a-real-password"));
        assertTrueMessage(ex, "wildcard");
    }

    @Test
    void insecureHttpOrigin_rejected() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> validate("http://shop.example.com", "a-real-secret", "a-real-password"));
        assertTrueMessage(ex, "https://");
    }

    @Test
    void emptyOriginList_rejected() {
        assertThrows(IllegalStateException.class,
                () -> validate("  ", "a-real-secret", "a-real-password"));
    }

    @Test
    void malformedOrigin_rejected() {
        assertThrows(IllegalStateException.class,
                () -> validate("shop.example.com", "a-real-secret", "a-real-password"));
    }

    @Test
    void exampleJwtPlaceholder_rejected() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> validate(HTTPS_ORIGIN, EXAMPLE_SECRET, "a-real-password"));
        assertTrueMessage(ex, "JWT_SECRET");
        // The failure message must name the variable, never the value.
        assertFalse(ex.getMessage().contains(EXAMPLE_SECRET),
                "Startup error must not echo the secret value: " + ex.getMessage());
    }

    @Test
    void exampleDatabasePasswordPlaceholder_rejected() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> validate(HTTPS_ORIGIN, "a-real-secret", EXAMPLE_PASSWORD));
        assertTrueMessage(ex, "DB_PASSWORD");
        assertFalse(ex.getMessage().contains(EXAMPLE_PASSWORD),
                "Startup error must not echo the password value: " + ex.getMessage());
    }

    @Test
    void blankSecret_rejected() {
        assertThrows(IllegalStateException.class,
                () -> validate(HTTPS_ORIGIN, " ", "a-real-password"));
    }

    private static void assertTrueMessage(IllegalStateException ex, String expectedFragment) {
        assertFalse(ex.getMessage() == null || !ex.getMessage().contains(expectedFragment),
                "Expected the error to mention '" + expectedFragment + "' but was: " + ex.getMessage());
    }
}
