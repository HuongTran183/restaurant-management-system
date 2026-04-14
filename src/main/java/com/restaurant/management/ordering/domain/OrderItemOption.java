package com.restaurant.management.ordering.domain;

import com.restaurant.management.common.model.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "order_item_options")
public class OrderItemOption extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(nullable = false, length = 120)
    private String optionNameSnapshot;

    @Column(nullable = false, length = 120)
    private String optionValueSnapshot;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAdjustment;

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public String getOptionNameSnapshot() {
        return optionNameSnapshot;
    }

    public void setOptionNameSnapshot(String optionNameSnapshot) {
        this.optionNameSnapshot = optionNameSnapshot;
    }

    public String getOptionValueSnapshot() {
        return optionValueSnapshot;
    }

    public void setOptionValueSnapshot(String optionValueSnapshot) {
        this.optionValueSnapshot = optionValueSnapshot;
    }

    public BigDecimal getPriceAdjustment() {
        return priceAdjustment;
    }

    public void setPriceAdjustment(BigDecimal priceAdjustment) {
        this.priceAdjustment = priceAdjustment;
    }
}
