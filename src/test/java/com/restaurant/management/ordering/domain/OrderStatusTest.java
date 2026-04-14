package com.restaurant.management.ordering.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OrderStatusTest {

    @Test
    void shouldExposeExpectedStateTransitions() {
        assertThat(OrderStatus.DRAFT.canEditItems()).isTrue();
        assertThat(OrderStatus.DRAFT.canConfirm()).isTrue();
        assertThat(OrderStatus.DRAFT.canCancel()).isTrue();

        assertThat(OrderStatus.CONFIRMED.canEditItems()).isFalse();
        assertThat(OrderStatus.CONFIRMED.canComplete()).isTrue();
        assertThat(OrderStatus.CONFIRMED.canCancel()).isTrue();

        assertThat(OrderStatus.COMPLETED.isFinalState()).isTrue();
        assertThat(OrderStatus.CANCELLED.isFinalState()).isTrue();
    }
}
