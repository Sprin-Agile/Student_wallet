CREATE DATABASE IF NOT EXISTS student_wallet;
USE student_wallet;

-- 1. Bảng Người dùng (Gốc của mọi liên kết)
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(255) NOT NULL UNIQUE,
                                     password VARCHAR(255) NOT NULL
);
DROP TABLE IF EXISTS wallets;

-- 2. Bảng Quản lý Ví
CREATE TABLE IF NOT EXISTS wallets (
                                       id VARCHAR(50),
                                       username VARCHAR(255),
                                       name VARCHAR(100),
                                       type VARCHAR(50),
                                       icon VARCHAR(50),
                                       initial_balance BIGINT DEFAULT 0,
                                       PRIMARY KEY (id, username),
                                       FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 3. Bảng Thu Chi
DROP TABLE IF EXISTS transactions;

CREATE TABLE IF NOT EXISTS transactions (
                                            id VARCHAR(50),
                                            username VARCHAR(255),
                                            amount BIGINT,
                                            category VARCHAR(100),
                                            note TEXT,
                                            type VARCHAR(50),
                                            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            wallet_id VARCHAR(50),
                                            FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 4. Bảng Ngân sách
CREATE TABLE IF NOT EXISTS budgets (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       username VARCHAR(255),
                                       category VARCHAR(100),
                                       name VARCHAR(100),
                                       amount BIGINT,
                                       created_at BIGINT,
                                       is_general BOOLEAN,
                                       FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 5. Bảng Mục tiêu tiết kiệm
CREATE TABLE IF NOT EXISTS goals (
                                     username VARCHAR(255) PRIMARY KEY,
                                     name VARCHAR(255),
                                     target_amount BIGINT,
                                     FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);