-- ============================================
-- Task Insight DMS - Add File Reminders Table
-- Version: 2.2
-- Description: Migration to add file reminders/to-do documents feature
-- ============================================

USE task_insight;

SET NAMES utf8mb4;
SET TIME_ZONE = '+08:00';

-- ============================================
-- FILE REMINDERS TABLE
-- ============================================

-- Drop if exists (for re-running migration)
DROP TABLE IF EXISTS file_reminders;

-- File Reminders Table - For To-Do Documents feature
CREATE TABLE file_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_id INT NOT NULL,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    reminder_datetime DATETIME NOT NULL,
    title VARCHAR(255) NULL,
    note TEXT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'notified', 'completed', 'dismissed') DEFAULT 'pending',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
    recurrence_end_date DATE NULL,
    notified_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_user_reminders (user_id, status, reminder_datetime),
    INDEX idx_org_reminders (organization_id, status),
    INDEX idx_file_reminders (file_id),
    INDEX idx_reminder_datetime (reminder_datetime, status),
    INDEX idx_pending_reminders (status, reminder_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show the new table
DESCRIBE file_reminders;

SELECT 'File reminders table created successfully!' as status;

