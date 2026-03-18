package com.restaurant.management.floor.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TableSessionServiceTest {

    @Test
    void shouldRejectOpeningSessionForInactiveTable() {
        TableSessionRepository tableSessionRepository = mock(TableSessionRepository.class);
        DiningTableService diningTableService = mock(DiningTableService.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);

        TableSessionService service = new TableSessionService(
                tableSessionRepository,
                diningTableService,
                orderRepository,
                invoiceRepository
        );

        DiningTable diningTable = new DiningTable();
        ReflectionTestUtils.setField(diningTable, "id", 8L);
        diningTable.setCode("T-08");
        diningTable.setName("Table 08");
        diningTable.setActive(false);
        diningTable.setStatus(TableStatus.AVAILABLE);

        when(tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(8L, TableSessionStatus.OPEN))
                .thenReturn(Optional.empty());
        when(diningTableService.findTable(8L)).thenReturn(diningTable);

        assertThatThrownBy(() -> service.findOrOpenSessionByTableId(8L))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("inactive");
    }
}
