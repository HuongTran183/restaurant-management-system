package com.restaurant.management.customer.service;

import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.customer.domain.Customer;
import com.restaurant.management.customer.dto.CustomerRequest;
import com.restaurant.management.customer.dto.CustomerResponse;
import com.restaurant.management.customer.repository.CustomerRepository;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> list(PageRequest pageRequest, String query, Boolean active) {
        Page<Customer> page = customerRepository.findAll(byFilters(query, active), pageRequest);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long customerId) {
        return toResponse(findCustomer(customerId));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = new Customer();
        customer.setCode(nextCode());
        applyRequest(customer, request);
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long customerId, CustomerRequest request) {
        Customer customer = findCustomer(customerId);
        applyRequest(customer, request);
        return toResponse(customer);
    }

    public Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private Specification<Customer> byFilters(String query, Boolean active) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();
            if (query != null && !query.isBlank()) {
                String keyword = "%" + query.trim().toLowerCase() + "%";
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("code")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), keyword)
                        )
                );
            }
            if (active != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("active"), active));
            }
            return predicate;
        };
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setFullName(request.fullName().trim());
        customer.setPhone(request.phone().trim());
        customer.setEmail(request.email() == null || request.email().isBlank() ? null : request.email().trim());
        customer.setActive(request.active());
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCode(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.isActive()
        );
    }

    private String nextCode() {
        byte[] buffer = new byte[5];
        secureRandom.nextBytes(buffer);
        return "CUS-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }
}
