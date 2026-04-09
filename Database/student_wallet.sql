create table users
(
    id       int auto_increment
        primary key,
    username varchar(50)  not null,
    password varchar(255) not null,
    constraint username
        unique (username)
);

CREATE TABLE transactions (
                              id INT AUTO_INCREMENT PRIMARY KEY,
                              username VARCHAR(50),
                              amount INT,
                              category VARCHAR(100),
                              note TEXT,
                              type VARCHAR(20),
                              date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

