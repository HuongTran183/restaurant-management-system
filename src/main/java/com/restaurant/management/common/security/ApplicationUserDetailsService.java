package com.restaurant.management.common.security;

import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class ApplicationUserDetailsService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    public ApplicationUserDetailsService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        UserAccount userAccount = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return AuthenticatedUser.from(userAccount);
    }
}
