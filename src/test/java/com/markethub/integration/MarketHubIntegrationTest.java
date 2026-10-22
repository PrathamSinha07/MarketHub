package com.markethub.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.markethub.modules.product.entity.Category;
import com.markethub.modules.product.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.net.URI;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Full-stack integration tests that boot the real application context and run
 * every HTTP call through Spring Security, JPA and the database.
 *
 * These tests intentionally use the default profile (PostgreSQL). They are the
 * guard that keeps a H2 substitute from ever being claimed as PostgreSQL
 * integration: {@link #theDataSourceIsRealPostgreSQL()} fails the suite if the
 * configured datasource is anything other than the local PostgreSQL server.
 *
 * Required environment (same as running the app):
 *   DB_PASSWORD  - PostgreSQL password
 *   JWT_SECRET   - 32+ byte signing secret
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MarketHubIntegrationTest {

    private static final String API = "/api/v1";

    /**
     * Plain RestTemplate: the JDK request factory returns 4xx/5xx responses
     * as-is, so the suite can assert on real status codes instead of having
     * an HTTP client's auth-retry logic throw first.
     */
    private final RestTemplate client = newClient();

    /** Absolute URLs keep the test independent of the handler's base-URI rules. */
    @LocalServerPort
    private int port;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private CategoryRepository categoryRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private final String sfx = UUID.randomUUID().toString().replace("-", "").substring(0, 12);

    // ------------------------------------------------------------------ data

    /** The datasource must be the real PostgreSQL server, never an in-memory substitute. */
    @Test
    void theDataSourceIsRealPostgreSQL() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            String url = conn.getMetaData().getURL();
            assertTrue(url.startsWith("jdbc:postgresql"),
                    "Integration tests must run against PostgreSQL but the datasource was: " + url);
            assertEquals("PostgreSQL", conn.getMetaData().getDatabaseProductName());
            assertTrue(conn.getMetaData().getURL().contains("markethub_db"),
                    "Expected the markethub_db database, got: " + url);
        }
    }

    // ------------------------------------------------------------------ auth

    @Test
    void customerRegistrationAndLoginWork() {
        String email = "it-cust-" + sfx + "@example.com";

        Map<String, Object> register = new HashMap<>();
        register.put("email", email);
        register.put("password", "Password1!");
        register.put("firstName", "Integration");
        register.put("lastName", "Tester");
        register.put("role", "ROLE_CUSTOMER");

        ResponseEntity<String> created = post(API + "/auth/register", register, null);
        assertEquals(201, created.getStatusCode().value(), created.getBody());
        assertEquals(email, data(created).get("email").asText());
        assertEquals("ROLE_CUSTOMER", data(created).get("role").asText());
        assertNotNull(data(created).get("token").asText());
        assertEquals("ROLE_CUSTOMER", login(email, "Password1!"));

        // Wrong password must be 401, never a server error.
        ResponseEntity<String> badLogin = post(API + "/auth/login",
                Map.of("email", email, "password", "wrong-password"), null);
        assertEquals(401, badLogin.getStatusCode().value(), badLogin.getBody());

        // Duplicate registration is rejected.
        ResponseEntity<String> duplicate = post(API + "/auth/register", register, null);
        assertEquals(400, duplicate.getStatusCode().value(), duplicate.getBody());

        // Self-service admin signup must be impossible (privilege escalation).
        Map<String, Object> admin = new HashMap<>(register);
        admin.put("email", "it-admin-" + sfx + "@example.com");
        admin.put("role", "ROLE_ADMIN");
        ResponseEntity<String> adminRes = post(API + "/auth/register", admin, null);
        assertEquals(400, adminRes.getStatusCode().value(), adminRes.getBody());
    }

    @Test
    void registrationAndLoginAreCaseInsensitiveOnEmail() {
        String mixedCase = "it-Case-" + sfx + "@Example.COM";

        Map<String, Object> register = new HashMap<>();
        register.put("email", mixedCase);
        register.put("password", "Password1!");
        register.put("firstName", "Integration");
        register.put("lastName", "CaseTester");
        register.put("role", "ROLE_CUSTOMER");

        ResponseEntity<String> created = post(API + "/auth/register", register, null);
        assertEquals(201, created.getStatusCode().value(), created.getBody());
        // Emails are stored normalized (lower-case).
        assertEquals(mixedCase.toLowerCase(java.util.Locale.ROOT), data(created).get("email").asText());

        // The same address in a different case is the same account.
        Map<String, Object> duplicate = new HashMap<>(register);
        duplicate.put("email", mixedCase.toLowerCase(java.util.Locale.ROOT));
        ResponseEntity<String> duplicateRes = post(API + "/auth/register", duplicate, null);
        assertEquals(400, duplicateRes.getStatusCode().value(), duplicateRes.getBody());

        // Login works with any casing of the address.
        assertEquals("ROLE_CUSTOMER", login(mixedCase.toUpperCase(java.util.Locale.ROOT), "Password1!"));
    }

    @Test
    void authorizationAndRoleRestrictionsAreEnforced() {
        String customer = registerCustomer("authz-cust");
        String seller = registerSeller("authz-store").token;

        // Anonymous callers are rejected with 401 everywhere it matters.
        assertEquals(401, get(API + "/orders", null).getStatusCode().value());
        assertEquals(401, get(API + "/cart", null).getStatusCode().value());
        assertEquals(401, post(API + "/products", productBody("nope-" + sfx), null).getStatusCode().value());
        assertEquals(401, get(API + "/orders/seller", null).getStatusCode().value());

        // A customer may not use seller or admin endpoints.
        assertEquals(403, post(API + "/products", productBody("cust-prod-" + sfx), customer).getStatusCode().value());
        assertEquals(403, get(API + "/orders/seller", customer).getStatusCode().value());
        assertEquals(403, get(API + "/products/seller", customer).getStatusCode().value());
        assertEquals(403, post(API + "/categories",
                Map.of("name", "IT Cat " + sfx, "slug", "it-cat-" + sfx), customer).getStatusCode().value());

        // A seller may not use customer endpoints.
        assertEquals(403, get(API + "/orders", seller).getStatusCode().value());
        assertEquals(403, get(API + "/cart", seller).getStatusCode().value());

        // Public catalog stays anonymous-friendly.
        assertEquals(200, get(API + "/products", null).getStatusCode().value());
        assertEquals(200, get(API + "/categories", null).getStatusCode().value());
    }

    // -------------------------------------------------------------- catalog

    @Test
    public void publicProductBrowsingSearchSortAndFilterWork() {
        Seller seller = registerSeller("browse-store");
        Long category = ensureCategory();

        String token = "itw" + sfx;
        JsonNode product = createProduct(seller.token, "IT Searchable " + token, category,
                new BigDecimal("7.99"), 50);
        long productId = product.get("id").asLong();

        // Public listing works and includes the new product.
        JsonNode page = data(get(API + "/products?size=100", null));
        assertTrue(page.has("content"), "Expected a paginated product listing");
        assertTrue(ids(page.get("content")).contains(productId));

        // Server-side search narrows to the matching product.
        JsonNode searched = data(get(API + "/products?search=" + token, null));
        assertTrue(ids(searched.get("content")).contains(productId),
                "Search should find the product by name");

        // Sorting by price ascending really sorts.
        JsonNode sorted = data(get(API + "/products?sortBy=price_asc&size=100", null));
        List<BigDecimal> prices = new ArrayList<>();
        for (JsonNode n : sorted.get("content")) {
            prices.add(new BigDecimal(n.get("price").asText()));
        }
        for (int i = 1; i < prices.size(); i++) {
            assertTrue(prices.get(i - 1).compareTo(prices.get(i)) <= 0,
                    "price_asc results are not sorted: " + prices);
        }

        // Unknown sort values fall back safely instead of erroring.
        assertEquals(200, get(API + "/products?sortBy=bogus%3BDROP%20TABLE", null).getStatusCode().value());

        // Category filter only returns that category.
        JsonNode filtered = data(get(API + "/products?categoryId=" + category + "&size=100", null));
        assertFalse(filtered.get("content").isEmpty());
        for (JsonNode n : filtered.get("content")) {
            assertEquals(category, n.get("categoryId").asLong());
        }

        // Archived products disappear from the public surface.
        assertEquals(200, delete(API + "/products/" + productId, seller.token).getStatusCode().value());
        JsonNode afterArchive = data(get(API + "/products?search=" + token, null));
        assertFalse(ids(afterArchive.get("content")).contains(productId),
                "Archived product must not appear in public search results");
        assertEquals(404, get(API + "/products/" + productId, null).getStatusCode().value());
    }

    // ------------------------------------------------------------------ cart

    @Test
    void cartCreationUpdateAndRemovalWork() {
        String customer = registerCustomer("cart-cust");
        Seller seller = registerSeller("cart-store");
        Long category = ensureCategory();
        JsonNode product = createProduct(seller.token, "IT Cart Product " + sfx, category,
                new BigDecimal("10.00"), 20);
        long productId = product.get("id").asLong();

        // A brand-new customer gets an empty cart, not a 404.
        JsonNode empty = data(get(API + "/cart", customer));
        assertTrue(empty.get("items").isArray() && empty.get("items").isEmpty(),
                "New customer should start with an empty cart");

        // Add an item.
        JsonNode added = data(post(API + "/cart/items",
                Map.of("productId", productId, "quantity", 2), customer));
        assertEquals(1, added.get("items").size());
        JsonNode item = added.get("items").get(0);
        long cartItemId = item.get("cartItemId").asLong();
        assertEquals(2, item.get("quantity").asInt());
        assertEquals(0, new BigDecimal(added.get("subtotal").asText())
                .compareTo(new BigDecimal("20.00")));

        // Adding the same product again accumulates quantity.
        JsonNode twice = data(post(API + "/cart/items",
                Map.of("productId", productId, "quantity", 3), customer));
        assertEquals(1, twice.get("items").size());
        assertEquals(5, twice.get("items").get(0).get("quantity").asInt());

        // Update the quantity.
        JsonNode updated = data(put(API + "/cart/items/" + cartItemId,
                Map.of("quantity", 4), customer));
        assertEquals(4, updated.get("items").get(0).get("quantity").asInt());

        // Remove the item.
        JsonNode removed = data(delete(API + "/cart/items/" + cartItemId, customer));
        assertTrue(removed.get("items").isEmpty());

        // Clear the whole cart.
        post(API + "/cart/items", Map.of("productId", productId, "quantity", 1), customer);
        JsonNode cleared = data(delete(API + "/cart", customer));
        assertTrue(cleared.get("items").isEmpty());

        // Quantity beyond stock is refused.
        ResponseEntity<String> tooMany = post(API + "/cart/items",
                Map.of("productId", productId, "quantity", 9999), customer);
        assertTrue(tooMany.getStatusCode().is4xxClientError(),
                "Over-stock add must be rejected, got " + tooMany.getStatusCode());
    }

    // -------------------------------------------------------------- checkout

    @Test
    void checkoutPersistsOrderAndClearsCart() {
        String customer = registerCustomer("checkout-cust");
        Seller seller = registerSeller("checkout-store");
        Long category = ensureCategory();

        JsonNode p1 = createProduct(seller.token, "IT Checkout One " + sfx, category,
                new BigDecimal("19.50"), 100);
        JsonNode p2 = createProduct(seller.token, "IT Checkout Two " + sfx, category,
                new BigDecimal("4.25"), 100);
        long id1 = p1.get("id").asLong();
        long id2 = p2.get("id").asLong();

        post(API + "/cart/items", Map.of("productId", id1, "quantity", 2), customer);
        post(API + "/cart/items", Map.of("productId", id2, "quantity", 3), customer);

        ResponseEntity<String> checkoutRes = post(API + "/orders/checkout", null, customer);
        assertEquals(201, checkoutRes.getStatusCode().value(), checkoutRes.getBody());
        JsonNode order = data(checkoutRes);
        long orderId = order.get("orderId").asLong();
        assertEquals("CONFIRMED", order.get("status").asText());
        assertEquals(0, new BigDecimal(order.get("totalAmount").asText())
                .compareTo(new BigDecimal("51.75")), "Expected 19.50*2 + 4.25*3");
        assertEquals(2, order.get("items").size());

        // Cart is emptied by checkout.
        assertTrue(data(get(API + "/cart", customer)).get("items").isEmpty());

        // The order persists and is visible in history.
        JsonNode history = data(get(API + "/orders", customer));
        assertTrue(history.isArray());
        boolean found = false;
        for (JsonNode o : history) {
            if (o.get("orderId").asLong() == orderId) {
                found = true;
            }
        }
        assertTrue(found, "Placed order missing from customer order history");

        JsonNode fetched = data(get(API + "/orders/" + orderId, customer));
        assertEquals(orderId, fetched.get("orderId").asLong());
        assertEquals(0, new BigDecimal(fetched.get("totalAmount").asText())
                .compareTo(new BigDecimal("51.75")));

        // Stock was decremented for real.
        assertEquals(98, data(get(API + "/products/" + id1, null)).get("stockQuantity").asInt());
        assertEquals(97, data(get(API + "/products/" + id2, null)).get("stockQuantity").asInt());

        // Second checkout of an empty cart is a clean 400.
        ResponseEntity<String> emptyCheckout = post(API + "/orders/checkout", null, customer);
        assertEquals(400, emptyCheckout.getStatusCode().value(), emptyCheckout.getBody());
    }

    // ------------------------------------------------------------- payments

    /**
     * Payment module end-to-end. No gateway is integrated, so a payment can be
     * initiated but must stay PENDING forever: the no-op gateway fabricates no
     * gateway reference, and every webhook (signed or not) is rejected. This is
     * what guarantees an unpaid order can never be represented as paid.
     */
    @Test
    void paymentLifecycleStaysPendingAndRejectsUnverifiedWebhooks() {
        String customer = registerCustomer("pay-cust");
        Seller seller = registerSeller("pay-store");
        Long category = ensureCategory();

        JsonNode product = createProduct(seller.token, "IT Payable " + sfx, category,
                new BigDecimal("10.00"), 50);
        post(API + "/cart/items",
                Map.of("productId", product.get("id").asLong(), "quantity", 2), customer);
        JsonNode order = data(post(API + "/orders/checkout", null, customer));
        long orderId = order.get("orderId").asLong();

        // Payments are customer-only: anonymous 401, seller 403.
        assertEquals(401, get(API + "/payments", null).getStatusCode().value());
        assertEquals(403, get(API + "/payments", seller.token).getStatusCode().value());

        // Initiate a payment: created PENDING, with no gateway reference.
        ResponseEntity<String> initiated = post(API + "/payments",
                Map.of("orderId", orderId, "paymentMethod", "COD"), customer);
        assertEquals(201, initiated.getStatusCode().value(), initiated.getBody());
        JsonNode payment = data(initiated);
        assertEquals("PENDING", payment.get("status").asText());
        assertTrue(payment.get("gatewayReferenceId").isNull(),
                "No-op gateway must not fabricate a gateway reference");

        // Listed for the customer and retrievable per order.
        JsonNode payments = data(get(API + "/payments", customer));
        assertEquals(1, payments.size());
        assertEquals("PENDING",
                data(get(API + "/payments/order/" + orderId, customer)).get("status").asText());

        // A second active payment for the same order is refused.
        ResponseEntity<String> duplicate = post(API + "/payments",
                Map.of("orderId", orderId, "paymentMethod", "COD"), customer);
        assertEquals(409, duplicate.getStatusCode().value(), duplicate.getBody());

        // Webhooks: missing signature is a 400, a forged signature is a 403.
        String reference = payment.get("paymentReference").asText();
        ResponseEntity<String> noSignature = post(API + "/payments/webhook",
                Map.of("paymentReference", reference, "status", "CAPTURED",
                        "eventId", "it-evt-nosig-" + sfx), null);
        assertEquals(400, noSignature.getStatusCode().value(), noSignature.getBody());

        ResponseEntity<String> forged = post(API + "/payments/webhook",
                Map.of("paymentReference", reference, "status", "CAPTURED",
                        "eventId", "it-evt-forged-" + sfx, "signature", "forged"), null);
        assertEquals(403, forged.getStatusCode().value(), forged.getBody());

        // Still pending after the attempts: nothing became "paid".
        assertEquals("PENDING",
                data(get(API + "/payments/order/" + orderId, customer)).get("status").asText());
        assertEquals("PENDING", data(get(API + "/payments", customer))
                .get(0).get("status").asText());
    }

    /**
     * Two "Place order" submissions racing each other (double click, retried
     * request, two tabs) must produce exactly one order: the cart row is locked
     * for the duration of checkout, so the loser is rejected with a 400 after
     * the cart has been emptied - not a duplicate order with double-decremented
     * stock.
     */
    @Test
    void concurrentDuplicateCheckoutSubmitsCreateExactlyOneOrder() throws Exception {
        String customer = registerCustomer("dup-cust");
        Seller seller = registerSeller("dup-store");
        Long category = ensureCategory();

        JsonNode product = createProduct(seller.token, "IT Dup Product " + sfx, category,
                new BigDecimal("20.00"), 5);
        long productId = product.get("id").asLong();
        post(API + "/cart/items", Map.of("productId", productId, "quantity", 2), customer);

        List<ResponseEntity<String>> results = runConcurrently(List.of(
                () -> post(API + "/orders/checkout", null, customer),
                () -> post(API + "/orders/checkout", null, customer)));

        long created = results.stream().filter(r -> r.getStatusCode().value() == 201).count();
        long rejected = results.stream().filter(r -> r.getStatusCode().value() == 400).count();
        assertEquals(1, created, "Expected exactly one order, got: " + statusList(results));
        assertEquals(1, rejected, "Duplicate submission must be rejected: " + statusList(results));

        // One order in history, stock decremented exactly once, cart empty.
        assertEquals(1, data(get(API + "/orders", customer)).size());
        assertEquals(3, data(get(API + "/products/" + productId, null)).get("stockQuantity").asInt());
        assertTrue(data(get(API + "/cart", customer)).get("items").isEmpty());
    }

    /**
     * Two different customers racing for the last remaining unit: exactly one
     * checkout may win, stock must end at 0 and must never go negative.
     */
    @Test
    void concurrentCheckoutsCannotOversellTheLastUnit() throws Exception {
        String customerA = registerCustomer("race-a");
        String customerB = registerCustomer("race-b");
        Seller seller = registerSeller("race-store");
        Long category = ensureCategory();

        JsonNode product = createProduct(seller.token, "IT Race Product " + sfx, category,
                new BigDecimal("7.50"), 1);
        long productId = product.get("id").asLong();

        post(API + "/cart/items", Map.of("productId", productId, "quantity", 1), customerA);
        post(API + "/cart/items", Map.of("productId", productId, "quantity", 1), customerB);

        List<ResponseEntity<String>> results = runConcurrently(List.of(
                () -> post(API + "/orders/checkout", null, customerA),
                () -> post(API + "/orders/checkout", null, customerB)));

        long created = results.stream().filter(r -> r.getStatusCode().value() == 201).count();
        long rejected = results.stream().filter(r -> r.getStatusCode().value() == 400).count();
        assertEquals(1, created, "Only one buyer can take the last unit: " + statusList(results));
        assertEquals(1, rejected, "The loser must be rejected with insufficient stock: " + statusList(results));

        int stock = data(get(API + "/products/" + productId, null)).get("stockQuantity").asInt();
        assertEquals(0, stock, "Stock must end at zero and must never go negative");

        long orders = data(get(API + "/orders", customerA)).size()
                + data(get(API + "/orders", customerB)).size();
        assertEquals(1, orders, "Exactly one order may exist for the last unit");
    }

    // ---------------------------------------------------------- order access

    @Test
    void customerOrderHistoryAndOwnershipAreProtected() {
        String owner = registerCustomer("order-owner");
        String stranger = registerCustomer("order-stranger");
        Seller seller = registerSeller("order-store");
        Long category = ensureCategory();
        JsonNode product = createProduct(seller.token, "IT Order Product " + sfx, category,
                new BigDecimal("12.00"), 50);

        post(API + "/cart/items",
                Map.of("productId", product.get("id").asLong(), "quantity", 1), owner);
        long orderId = data(post(API + "/orders/checkout", null, owner)).get("orderId").asLong();

        // Owner sees the order; a different customer does not see it at all.
        assertTrue(data(get(API + "/orders", owner)).isArray());
        boolean strangerSawIt = false;
        for (JsonNode o : data(get(API + "/orders", stranger))) {
            if (o.get("orderId").asLong() == orderId) {
                strangerSawIt = true;
            }
        }
        assertFalse(strangerSawIt, "Order history leaked another customer's order");

        // Direct fetch of someone else's order is forbidden.
        assertEquals(403, get(API + "/orders/" + orderId, stranger).getStatusCode().value());
        assertEquals(200, get(API + "/orders/" + orderId, owner).getStatusCode().value());
        // Unknown id is a 404, not a 500.
        assertEquals(404, get(API + "/orders/999999999", owner).getStatusCode().value());
    }

    // ------------------------------------------------------------ seller ops

    @Test
    void sellerProductManagementWorks() {
        Seller sellerA = registerSeller("mgmt-store-a");
        Seller sellerB = registerSeller("mgmt-store-b");
        Long category = ensureCategory();

        String slug = "it-mgmt-" + sfx;
        JsonNode created = createProduct(sellerA.token, "IT Managed Product " + sfx, category,
                new BigDecimal("25.00"), 30);
        long productId = created.get("id").asLong();

        // The seller sees it in their own listing.
        boolean inSellerList = false;
        for (JsonNode p : data(get(API + "/products/seller?size=100", sellerA.token)).get("content")) {
            if (p.get("id").asLong() == productId) {
                inSellerList = true;
            }
        }
        assertTrue(inSellerList, "Created product missing from /products/seller");

        // Update propagates to the public catalog.
        Map<String, Object> update = new HashMap<>(productBody(slug));
        update.put("name", "IT Managed Product Updated " + sfx);
        update.put("price", new BigDecimal("31.50"));
        update.put("categoryId", category);
        JsonNode updated = data(put(API + "/products/" + productId, update, sellerA.token));
        assertEquals("IT Managed Product Updated " + sfx, updated.get("name").asText());
        JsonNode publicView = data(get(API + "/products/" + productId, null));
        assertEquals(0, new BigDecimal(publicView.get("price").asText())
                .compareTo(new BigDecimal("31.50")));

        // Another seller cannot edit or archive someone else's product.
        assertEquals(403, put(API + "/products/" + productId, update, sellerB.token).getStatusCode().value());
        assertEquals(403, delete(API + "/products/" + productId, sellerB.token).getStatusCode().value());

        // A customer cannot see the seller listing.
        String customer = registerCustomer("mgmt-cust");
        assertEquals(403, get(API + "/products/seller", customer).getStatusCode().value());

        // Owner can archive; it then vanishes publicly but stays visible to the owner.
        assertEquals(200, delete(API + "/products/" + productId, sellerA.token).getStatusCode().value());
        assertEquals(404, get(API + "/products/" + productId, null).getStatusCode().value());
        JsonNode ownerView = data(get(API + "/products/" + productId, sellerA.token));
        assertEquals("ARCHIVED", ownerView.get("status").asText());
    }

    @Test
    void sellerOrderVisibilityIsRestrictedByOwnership() {
        Seller sellerA = registerSeller("vis-store-a");
        Seller sellerB = registerSeller("vis-store-b");
        String customer = registerCustomer("vis-cust");
        Long category = ensureCategory();

        JsonNode product = createProduct(sellerA.token, "IT Visible Product " + sfx, category,
                new BigDecimal("9.00"), 40);
        post(API + "/cart/items",
                Map.of("productId", product.get("id").asLong(), "quantity", 2), customer);
        long orderId = data(post(API + "/orders/checkout", null, customer)).get("orderId").asLong();

        // The owning seller sees exactly this order's line items.
        boolean ownerSawOrder = false;
        for (JsonNode item : data(get(API + "/orders/seller", sellerA.token))) {
            if (item.get("orderId").asLong() == orderId) {
                ownerSawOrder = true;
                assertEquals("IT Visible Product " + sfx, item.get("productName").asText());
                assertEquals("CONFIRMED", item.get("orderStatus").asText());
            }
        }
        assertTrue(ownerSawOrder, "Selling seller did not see the order for their product");

        // Any other seller must not see it.
        for (JsonNode item : data(get(API + "/orders/seller", sellerB.token))) {
            assertFalse(item.get("orderId").asLong() == orderId,
                    "Another seller could see an order they do not belong to");
        }

        // Sellers cannot read customer order endpoints.
        assertEquals(403, get(API + "/orders", sellerA.token).getStatusCode().value());
        assertEquals(403, get(API + "/orders/" + orderId, sellerA.token).getStatusCode().value());
    }

    // ------------------------------------------------------------ ops / health

    /**
     * Deployment smoke test: the health probe must answer without a token and
     * must not disclose anything beyond the aggregate status, while the
     * diagnostic actuators stay out of public reach.
     */
    @Test
    void healthEndpointIsPublicWithoutLeakingConfiguration() {
        ResponseEntity<String> health = get(API + "/actuator/health", null);
        assertEquals(200, health.getStatusCode().value(), health.getBody());
        assertTrue(health.getBody() != null && health.getBody().contains("\"status\":\"UP\""),
                "Expected an aggregate UP status, got: " + health.getBody());

        // Not exposed (not in management.endpoints.web.exposure.include) and,
        // being unlisted, not anonymous either: no config dump for the world.
        assertNotEquals(200, get(API + "/actuator/env", null).getStatusCode().value());
        assertNotEquals(200, get(API + "/actuator/configprops", null).getStatusCode().value());
        assertNotEquals(200, get(API + "/actuator/beans", null).getStatusCode().value());
    }

    // -------------------------------------------------------------- helpers

    /**
     * Runs the given tasks on separate threads, released together by a latch so
     * their HTTP requests actually overlap, and returns their responses in the
     * same order as the input.
     */
    private <T> List<T> runConcurrently(List<Callable<T>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        try {
            CountDownLatch ready = new CountDownLatch(tasks.size());
            CountDownLatch start = new CountDownLatch(1);
            List<Future<T>> futures = new ArrayList<>();
            for (Callable<T> task : tasks) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    start.await();
                    return task.call();
                }));
            }
            assertTrue(ready.await(10, TimeUnit.SECONDS), "Workers did not become ready in time");
            start.countDown();

            List<T> results = new ArrayList<>();
            for (Future<T> future : futures) {
                results.add(future.get(30, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    /** "201,400" - keeps failing status combinations readable in assertion messages. */
    private static String statusList(List<ResponseEntity<String>> responses) {
        StringBuilder sb = new StringBuilder("[");
        for (ResponseEntity<String> r : responses) {
            if (sb.length() > 1) {
                sb.append(',');
            }
            sb.append(r.getStatusCode().value());
        }
        return sb.append(']').toString();
    }

    private record Seller(String token, long userId) {
    }

    private String registerCustomer(String tag) {
        String email = "it-" + tag + "-" + sfx + "@example.com";
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", "Password1!");
        body.put("firstName", "IT");
        body.put("lastName", tag);
        body.put("role", "ROLE_CUSTOMER");
        ResponseEntity<String> res = post(API + "/auth/register", body, null);
        assertEquals(201, res.getStatusCode().value(), res.getBody());
        return data(res).get("token").asText();
    }

    private Seller registerSeller(String tag) {
        String email = "it-" + tag + "-" + sfx + "@example.com";
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", "Password1!");
        body.put("firstName", "IT");
        body.put("lastName", tag);
        body.put("role", "ROLE_SELLER");
        body.put("storeName", "IT Store " + tag + " " + sfx);
        body.put("storeDescription", "Integration test store");
        ResponseEntity<String> res = post(API + "/auth/register", body, null);
        assertEquals(201, res.getStatusCode().value(), res.getBody());
        return new Seller(data(res).get("token").asText(), data(res).get("userId").asLong());
    }

    private String login(String email, String password) {
        ResponseEntity<String> res = post(API + "/auth/login",
                Map.of("email", email, "password", password), null);
        assertEquals(200, res.getStatusCode().value(), res.getBody());
        return data(res).get("role").asText();
    }

    private Map<String, Object> productBody(String slugSuffix) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "IT Product " + slugSuffix);
        body.put("slug", "it-product-" + slugSuffix);
        body.put("description", "Integration test product");
        body.put("price", new BigDecimal("15.00"));
        body.put("stockQuantity", 100);
        body.put("categoryId", ensureCategory());
        return body;
    }

    private JsonNode createProduct(String sellerToken, String name, Long categoryId,
                                   BigDecimal price, int stock) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("slug", "it-" + UUID.randomUUID().toString().substring(0, 8));
        body.put("description", "Integration test product " + name);
        body.put("price", price);
        body.put("stockQuantity", stock);
        body.put("categoryId", categoryId);
        ResponseEntity<String> res = post(API + "/products", body, sellerToken);
        assertEquals(201, res.getStatusCode().value(), res.getBody());
        return data(res);
    }

    /** Uses an existing category, creating one directly when the table is empty. */
    private synchronized Long ensureCategory() {
        List<Category> all = categoryRepository.findAll();
        if (!all.isEmpty()) {
            return all.get(0).getId();
        }
        Category category = Category.builder()
                .name("IT Category " + sfx)
                .slug("it-category-" + sfx)
                .build();
        return categoryRepository.save(category).getId();
    }

    private JsonNode data(ResponseEntity<String> res) {
        try {
            JsonNode root = mapper.readTree(res.getBody() == null ? "" : res.getBody());
            return root.get("data");
        } catch (Exception e) {
            throw new IllegalStateException("Unparseable response: " + res.getBody(), e);
        }
    }

    private List<Long> ids(JsonNode array) {
        List<Long> ids = new ArrayList<>();
        for (JsonNode n : array) {
            ids.add(n.get("id").asLong());
        }
        return ids;
    }

    private ResponseEntity<String> get(String path, String token) {
        return exchange(HttpMethod.GET, path, null, token);
    }

    private ResponseEntity<String> post(String path, Object body, String token) {
        return exchange(HttpMethod.POST, path, body, token);
    }

    private ResponseEntity<String> put(String path, Object body, String token) {
        return exchange(HttpMethod.PUT, path, body, token);
    }

    private ResponseEntity<String> delete(String path, String token) {
        return exchange(HttpMethod.DELETE, path, null, token);
    }

    private ResponseEntity<String> exchange(HttpMethod method, String path, Object body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            headers.setBearerAuth(token);
        }
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        URI url = URI.create("http://localhost:" + port + path);
        return client.exchange(url, method, entity, String.class);
    }

    /** Returns every status to the test instead of throwing on 4xx/5xx. */
    private static RestTemplate newClient() {
        // java.net.http-based factory: unlike HttpURLConnection it delivers
        // 401/403 responses from POSTs instead of aborting with an IOException.
        RestTemplate restTemplate = new RestTemplate(new JdkClientHttpRequestFactory());
        restTemplate.setErrorHandler(new ResponseErrorHandler() {
            @Override
            public boolean hasError(ClientHttpResponse response) {
                return false;
            }

            @Override
            public void handleError(ClientHttpResponse response) {
                // no-op: assertions inspect the status directly
            }
        });
        return restTemplate;
    }
}
