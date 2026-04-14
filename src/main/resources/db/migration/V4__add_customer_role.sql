-- Add CUSTOMER role for public user registration
INSERT INTO roles (code, name, description, created_at, updated_at)
SELECT 'CUSTOMER', 'Customer', 'Restaurant customer with booking and ordering capabilities', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'CUSTOMER');
