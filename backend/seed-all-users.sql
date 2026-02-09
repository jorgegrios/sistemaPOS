-- Delete existing test users (except admin@test.com)
DELETE FROM users WHERE email IN (
  'admin@restaurant.com',
  'gerente@restaurant.com', 
  'mesero@restaurant.com',
  'cajero@restaurant.com',
  'cocinero@restaurant.com',
  'bartender@restaurant.com'
);

-- Insert all test users

-- ADMIN: admin@restaurant.com / admin123
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, 'admin@restaurant.com', '$2b$10$vstG71UiK1D8APiTAoUq4.lUi3sSs8wgCN/YmxSPWc0pxC3r7x99S', 'Admin', 'admin', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;

-- MANAGER: gerente@restaurant.com / gerente123
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, 'gerente@restaurant.com', '$2b$10$sH8tmA24W.sCPyPaI4GJue4uCtapUWPSqWpmgiCaR4B/uDrX392sq', 'Manager', 'manager', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;

-- WAITER: mesero@restaurant.com / mesero123
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, 'mesero@restaurant.com', '$2b$10$AeCN.KD2zQCIav43G63JZes4X9uFJelAZ3jkjLxqZa4lhhk4Zoj4W', 'Waiter', 'waiter', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;

-- CASHIER: cajero@restaurant.com / cajero123
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, 'cajero@restaurant.com', '$2b$10$17i/VeiYD/5NWqqZiGF4T.hFMNgAWi2SY8Y9uj2jAJowRGbyyQnYu', 'Cashier', 'cashier', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;

-- KITCHEN: cocinero@restaurant.com / cocinero123
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, 'cocinero@restaurant.com', '$2b$10$ubk2AbcSPxGQ8NBXf8/tHuIWoRzQOI7V8uzg8OuvRxeLHxEdU7A7q', 'Kitchen', 'kitchen', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;

-- BARTENDER: bartender@restaurant.com / bartender123
INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role, active)
SELECT c.id, r.id, 'bartender@restaurant.com', '$2b$10$Wiwa9/gstnW73WzFIQgoquhn2KUIqimgL8cUe02YwzHZDs3YdIv/m', 'Bartender', 'bartender', true
FROM companies c 
JOIN restaurants r ON r.company_id = c.id 
WHERE c.slug = 'default' 
LIMIT 1;
