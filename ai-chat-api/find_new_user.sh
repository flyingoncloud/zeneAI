#!/bin/bash
# Find the most recently registered user

psql -h localhost -p 5432 -U chat_user -d chat_db << EOF
\x
SELECT
    user_id,
    username,
    phone_number,
    phone_country_code,
    email,
    auth_provider,
    provider_id,
    is_active,
    password_hash IS NOT NULL as has_password,
    last_login_at,
    created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 1;
EOF
