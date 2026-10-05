package com.markethub.modules.order.service;

import com.markethub.modules.order.dto.OrderResponse;
import com.markethub.modules.order.dto.SellerOrderItemResponse;

import java.util.List;

public interface OrderService {

    OrderResponse checkout(Long userId);

    OrderResponse getOrderById(Long userId, Long orderId);

    List<OrderResponse> getCustomerOrders(Long userId);

    List<SellerOrderItemResponse> getSellerOrderItems(Long userId);
}
