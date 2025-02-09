-- Create the database (Run this separately if needed)
CREATE DATABASE ewaste_management;

-- Connect to the database
\c ewaste_management;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create Pickup Requests table
CREATE TABLE pickup_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    address TEXT NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Educational Content table
CREATE TABLE educational_content (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Support Tickets table
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Marketplace Listings table
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    condition TEXT NOT NULL,
    images JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create session table for authentication
CREATE TABLE session (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create admin user
INSERT INTO users (username, password, role, name, email, is_admin)
VALUES (
    'admin',
    -- This is the hashed version of 'admin123'
    '7b5970c194d8ba665bd6d1132e1bb47ac2886e8e6721e8f37bbfb9f0f776f1ae.4d29c9bcb1234567',
    'ADMIN',
    'Administrator',
    'admin@example.com',
    TRUE
);

-- Add foreign key constraints
ALTER TABLE pickup_requests
    ADD CONSTRAINT fk_pickup_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE educational_content
    ADD CONSTRAINT fk_educational_content_author
    FOREIGN KEY (author_id) REFERENCES users(id);

ALTER TABLE support_tickets
    ADD CONSTRAINT fk_support_tickets_user
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE marketplace_listings
    ADD CONSTRAINT fk_marketplace_listings_seller
    FOREIGN KEY (seller_id) REFERENCES users(id);
