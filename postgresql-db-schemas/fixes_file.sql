INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'b95f474e-b662-4051-8e37-28346b5ebbf8',  -- same tenant_id as your demo users
    'admin@demo.com',
    '$2b$12$tzfPdOOSWqU3ihu87aYEPujyNo1rZ.MUHz7E.8057kF5N14qr9kVG',
    'admin',
    'Lokesh',
    'Demo',
    TRUE,
    NOW(),
    NOW()
);

UPDATE users
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@demo.com';

SELECT * FROM users;

DROP TABLE alembic_version;

INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    role,
    first_name,
    last_name,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- generates a new UUID
    'b95f474e-b662-4051-8e37-28346b5ebbf8',
    'lokeshsohanda10@gmail.com',
    '$2b$12$fykEl/embGoaZKJaqBLkhemwOWbFhqlrZ/U5KENS1PmiItQ7kHdb',
    'student',
    'Lokesh',
    'Sohanda',
    TRUE,
    NOW(),
    NOW()
);