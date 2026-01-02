-- Whitelist Prefixes Table for GesCall
-- This table stores allowed 3-digit phone prefixes for 10-digit dialing plans

CREATE TABLE IF NOT EXISTS gescall_whitelist_prefixes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prefix VARCHAR(3) NOT NULL UNIQUE,
    description VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prefix (prefix),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example data (Colombian mobile prefixes)
-- INSERT INTO gescall_whitelist_prefixes (prefix, description) VALUES
-- ('300', 'Claro'),
-- ('301', 'Claro'),
-- ('302', 'Claro'),
-- ('310', 'Claro'),
-- ('311', 'Claro'),
-- ('312', 'Claro'),
-- ('313', 'Claro'),
-- ('314', 'Claro'),
-- ('315', 'Movistar'),
-- ('316', 'Movistar'),
-- ('317', 'Movistar'),
-- ('318', 'Movistar'),
-- ('319', 'Movistar'),
-- ('320', 'Tigo'),
-- ('321', 'Tigo'),
-- ('322', 'Tigo'),
-- ('323', 'Tigo'),
-- ('350', 'Wom');
