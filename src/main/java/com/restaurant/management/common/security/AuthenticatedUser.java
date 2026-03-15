package com.restaurant.management.common.security;

import com.restaurant.management.identity.domain.UserAccount;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class AuthenticatedUser implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final String fullName;
    private final boolean active;
    private final Set<GrantedAuthority> authorities;

    private AuthenticatedUser(
            Long id,
            String username,
            String password,
            String fullName,
            boolean active,
            Set<GrantedAuthority> authorities
    ) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.active = active;
        this.authorities = authorities;
    }

    public static AuthenticatedUser from(UserAccount userAccount) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        userAccount.getRoles().forEach(role ->
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getCode().name())));
        return new AuthenticatedUser(
                userAccount.getId(),
                userAccount.getUsername(),
                userAccount.getPasswordHash(),
                userAccount.getFullName(),
                userAccount.isActive(),
                authorities
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
