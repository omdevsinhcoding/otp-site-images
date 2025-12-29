-- Enable pgcrypto extension for password hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;