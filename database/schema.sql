-- ================================================================
-- AutoCare ERP (Bengkel Pro Management System) - MySQL 8.0 Database
-- Full Production-Ready Relational Schema & Initial Seed Data
-- ================================================================

CREATE DATABASE IF NOT EXISTS `autocare_erp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `autocare_erp`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. USERS & RBAC TABLE (10+ Workshop Roles)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM(
        'Super Admin', 'Owner', 'Service Advisor', 'Estimator', 
        'Foreman', 'Mekanik', 'Gudang', 'Purchasing', 'QC', 'Finance', 'Customer'
    ) NOT NULL DEFAULT 'Service Advisor',
    `avatar` VARCHAR(500) NULL,
    `phone` VARCHAR(30) NULL,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. CUSTOMERS (B2C, B2B Fleet & Insurance Partners)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `type` ENUM('Personal', 'Corporate', 'Insurance') DEFAULT 'Personal',
    `insurance_company` VARCHAR(150) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_customer_name` (`name`),
    INDEX `idx_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. VEHICLES (Customer Vehicle Inventory)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `plate_number` VARCHAR(20) UNIQUE NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INT NULL,
    `color` VARCHAR(50) NULL,
    `color_code` VARCHAR(50) NULL,
    `vin` VARCHAR(100) UNIQUE NULL,
    `engine_number` VARCHAR(100) UNIQUE NULL,
    `odometer_km` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    INDEX `idx_vehicles_plate` (`plate_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. WORK ORDERS / SPK (Core Transaction Engine)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `wo_number` VARCHAR(50) UNIQUE NOT NULL,
    `vehicle_id` BIGINT UNSIGNED NOT NULL,
    `service_advisor_id` BIGINT UNSIGNED NOT NULL,
    `foreman_id` BIGINT UNSIGNED NULL,
    `type` ENUM('Body Repair', 'General Repair', 'Maintenance') NOT NULL,
    `status` ENUM('Estimasi', 'Menunggu Approval', 'Proses', 'Menunggu Part', 'QC', 'Selesai', 'Batal') DEFAULT 'Estimasi',
    `priority` ENUM('Low', 'Normal', 'High', 'Urgent') DEFAULT 'Normal',
    `tracking_hash` VARCHAR(64) UNIQUE NOT NULL,
    `complaints` TEXT NULL,
    `estimated_completion` DATETIME NULL,
    `actual_completion` DATETIME NULL,
    `total_estimated_cost` DECIMAL(15,2) DEFAULT 0,
    `total_final_cost` DECIMAL(15,2) DEFAULT 0,
    `insurance_claim_number` VARCHAR(100) NULL,
    `deductible_own_risk_rp` DECIMAL(15,2) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`),
    FOREIGN KEY (`service_advisor_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`foreman_id`) REFERENCES `users`(`id`),
    INDEX `idx_wo_status` (`status`),
    INDEX `idx_wo_number` (`wo_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. PRODUCTION STAGES (Kanban Body & Paint Workflow)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `production_stages`;
CREATE TABLE `production_stages` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `stage_name` ENUM('Bongkar', 'Ketok', 'Las', 'Dempul', 'Epoxy', 'Cat', 'Poles', 'Pasang', 'Finalizing') NOT NULL,
    `mechanic_id` BIGINT UNSIGNED NULL,
    `status` ENUM('Pending', 'In Progress', 'Paused', 'Completed') DEFAULT 'Pending',
    `sequence_order` INT NOT NULL DEFAULT 1,
    `target_hours` DECIMAL(5,2) DEFAULT 4.0,
    `actual_hours` DECIMAL(5,2) DEFAULT 0,
    `notes` TEXT NULL,
    `started_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`mechanic_id`) REFERENCES `users`(`id`),
    INDEX `idx_stage_status` (`stage_name`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. PARTS & CHEMICAL INVENTORY (Zero Leakage Warehouse)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `parts_inventory`;
CREATE TABLE `parts_inventory` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sku` VARCHAR(100) UNIQUE NOT NULL,
    `barcode` VARCHAR(100) UNIQUE NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` ENUM('Body Part', 'Paint & Chemical', 'Consumable', 'Electrical', 'Underbody & Engine', 'Glass & Trim') NOT NULL,
    `bin_location` VARCHAR(50) NOT NULL DEFAULT 'RAK-GEN-01',
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `reserved_quantity` INT NOT NULL DEFAULT 0,
    `min_stock_level` INT NOT NULL DEFAULT 5,
    `max_stock_level` INT NOT NULL DEFAULT 20,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'Pcs',
    `unit_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `abc_class` ENUM('A', 'B', 'C') DEFAULT 'B',
    `expiry_date` DATE NULL,
    `batch_number` VARCHAR(100) NULL,
    `supplier_name` VARCHAR(150) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_parts_sku` (`sku`),
    INDEX `idx_parts_bin` (`bin_location`),
    INDEX `idx_parts_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. MATERIAL REQUISITIONS (SPK-Bound Bon Permintaan)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `material_requisitions`;
CREATE TABLE `material_requisitions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `requisition_number` VARCHAR(50) UNIQUE NOT NULL,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `requested_by_id` BIGINT UNSIGNED NOT NULL,
    `approved_by_id` BIGINT UNSIGNED NULL,
    `issued_by_id` BIGINT UNSIGNED NULL,
    `status` ENUM('WAITING_APPROVAL', 'READY_PICKING', 'ISSUED', 'PARTIAL_RETURN', 'COMPLETED') DEFAULT 'WAITING_APPROVAL',
    `issued_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
    FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`issued_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. REQUISITION ITEMS DETAIL
-- --------------------------------------------------------
DROP TABLE IF EXISTS `requisition_items`;
CREATE TABLE `requisition_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `requisition_id` BIGINT UNSIGNED NOT NULL,
    `part_id` BIGINT UNSIGNED NOT NULL,
    `requested_qty` INT NOT NULL,
    `issued_qty` INT NOT NULL DEFAULT 0,
    `returned_qty` INT NOT NULL DEFAULT 0,
    `unit_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (`requisition_id`) REFERENCES `material_requisitions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`part_id`) REFERENCES `parts_inventory`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. STOCK MOVEMENTS (Immutable Ledger / Zero Leakage)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `part_id` BIGINT UNSIGNED NOT NULL,
    `work_order_id` BIGINT UNSIGNED NULL COMMENT 'Mandatory for OUT transactions',
    `user_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('IN_PURCHASE', 'OUT_SPK', 'OUT_MIXING', 'IN_RETURN', 'ADJUST_OPNAME') NOT NULL,
    `ref_number` VARCHAR(100) NOT NULL,
    `quantity_change` INT NOT NULL,
    `balance_after` INT NOT NULL,
    `unit_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `total_cost` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`part_id`) REFERENCES `parts_inventory`(`id`),
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    INDEX `idx_movement_part` (`part_id`),
    INDEX `idx_movement_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. PAINT FORMULAS & OEM COLOR MIXING
-- --------------------------------------------------------
DROP TABLE IF EXISTS `paint_formulas`;
CREATE TABLE `paint_formulas` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `car_brand` VARCHAR(100) NOT NULL,
    `color_code` VARCHAR(50) NOT NULL,
    `color_name` VARCHAR(150) NOT NULL,
    `paint_system` VARCHAR(100) NOT NULL DEFAULT '2K Polyurethane Basecoat',
    `thinner_ratio_percent` INT DEFAULT 50,
    `hardener_ratio_percent` INT DEFAULT 20,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_formula_code` (`color_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `paint_mixing_logs`;
CREATE TABLE `paint_mixing_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mix_log_number` VARCHAR(50) UNIQUE NOT NULL,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `formula_id` BIGINT UNSIGNED NULL,
    `painter_id` BIGINT UNSIGNED NOT NULL,
    `panel_count` INT NOT NULL DEFAULT 1,
    `target_grams` DECIMAL(8,2) NOT NULL,
    `actual_grams_produced` DECIMAL(8,2) NOT NULL,
    `waste_percentage` DECIMAL(5,2) DEFAULT 0,
    `total_cost_rp` DECIMAL(15,2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
    FOREIGN KEY (`formula_id`) REFERENCES `paint_formulas`(`id`),
    FOREIGN KEY (`painter_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. QUALITY CONTROL (QC Checklist & Rework Routing)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `qc_inspections`;
CREATE TABLE `qc_inspections` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `inspector_id` BIGINT UNSIGNED NOT NULL,
    `result` ENUM('Pass', 'Fail', 'Rework') NOT NULL,
    `panel_gap_alignment` BOOLEAN DEFAULT TRUE,
    `paint_color_matching` BOOLEAN DEFAULT TRUE,
    `paint_surface_flawless` BOOLEAN DEFAULT TRUE,
    `electrical_functional` BOOLEAN DEFAULT TRUE,
    `cleanliness_interior_exterior` BOOLEAN DEFAULT TRUE,
    `notes` TEXT NULL,
    `inspected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
    FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. INVOICES & PAYMENTS (Finance & Cashier)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(50) UNIQUE NOT NULL,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `subtotal_services` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `subtotal_parts` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `tax_ppn_11_percent` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `payment_status` ENUM('UNPAID', 'PARTIAL', 'PAID') DEFAULT 'UNPAID',
    `payment_method` ENUM('CASH', 'TRANSFER_BCA', 'TRANSFER_MANDIRI', 'QRIS', 'INSURANCE_BILLING') NULL,
    `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
    `paid_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. AUDIT LOGS (Immutable Activity Log)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `action` VARCHAR(255) NOT NULL,
    `table_name` VARCHAR(100) NOT NULL,
    `record_id` BIGINT UNSIGNED NOT NULL,
    `old_data` JSON NULL,
    `new_data` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_table` (`table_name`, `record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- SEED DATA INITIALIZATION
-- ================================================================

-- Users Seed
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`) VALUES
(1, 'Super Admin Bengkel Pro', 'admin@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Super Admin', '081234567890'),
(2, 'Hendra Wijaya', 'owner@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Owner', '081234567891'),
(3, 'Dicky Suryana', 'sa.dicky@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Service Advisor', '081234567892'),
(4, 'Bambang Sutrisno', 'foreman.body@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Foreman', '081234567893'),
(5, 'Agus Santoso', 'mekanik.agus@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Mekanik', '081234567894'),
(6, 'Gunawan Prasetyo', 'gudang@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Gudang', '081234567895'),
(7, 'Maya Kartika', 'finance@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'Finance', '081234567896'),
(8, 'Eko Wahyudi', 'qc.eko@bengkelpro.com', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'QC', '081234567897');

-- Customers Seed
INSERT INTO `customers` (`id`, `name`, `phone`, `email`, `address`, `type`, `insurance_company`) VALUES
(1, 'PT Surya Kencana Logistik', '0215551234', 'fleet@suryakencana.co.id', 'Kawasan Industri Pulogadung Blok B', 'Corporate', NULL),
(2, 'Ahmad Fauzi', '081987654321', 'ahmad.fauzi@gmail.com', 'Jl. Kemang Raya No. 45, Jakarta Selatan', 'Insurance', 'Asuransi Astra Garda Oto'),
(3, 'Siti Nurhaliza', '085712345678', 'siti.nur@yahoo.com', 'Apartemen Sudirman Tower A-1205', 'Personal', NULL);

-- Vehicles Seed
INSERT INTO `vehicles` (`id`, `customer_id`, `plate_number`, `brand`, `model`, `year`, `color`, `color_code`, `vin`, `engine_number`, `odometer_km`) VALUES
(1, 2, 'B 1984 TYZ', 'Toyota', 'Innova Zenix Q Hybrid', 2023, 'White Pearl Crystal Shine', '070', 'MHFA1234567890123', 'M20A-FXS-987654', 18450),
(2, 3, 'B 2341 TZA', 'Honda', 'CR-V 1.5 Turbo Prestige', 2022, 'Crystal Black Pearl', 'NH731P', 'MRH23456789012345', 'L15BG-123456', 32100),
(3, 1, 'B 9088 UAX', 'Mitsubishi', 'Xpander Cross AT', 2024, 'Quartz White Pearl', 'W19', 'MMB34567890123456', '4A91-876543', 9800);

-- Parts Inventory Seed
INSERT INTO `parts_inventory` (`id`, `sku`, `barcode`, `name`, `category`, `bin_location`, `stock_quantity`, `min_stock_level`, `unit`, `unit_cost`, `unit_price`, `abc_class`, `supplier_name`) VALUES
(1, 'BPR-FR-INNOVA', '899100200301', 'Bumper Depan Original Toyota All New Kijang Innova Zenix', 'Body Part', 'RAK-A1-01', 4, 2, 'Pcs', 1850000.00, 2450000.00, 'A', 'Toyota Astra Parts Direct'),
(2, 'HDL-RH-INNOVA', '899100200302', 'Headlamp Kanan LED Projector Original Zenix', 'Electrical', 'RAK-B2-04', 2, 1, 'Pcs', 3200000.00, 4250000.00, 'A', 'Toyota Astra Parts Direct'),
(3, 'DMP-SICK-2K', '899200300401', 'Dempul Polyester 2K Sikkens Polykit Extra Smooth', 'Paint & Chemical', 'RAK-C1-02', 12, 5, 'Kaleng', 145000.00, 210000.00, 'C', 'AkzoNobel Coatings ID'),
(4, 'CLR-SIKK-AUTOCLEAR', '899200300402', 'Clear Coat 2K PU Sikkens Autoclear Plus + Hardener', 'Paint & Chemical', 'RAK-C1-05', 8, 3, 'Set', 385000.00, 520000.00, 'B', 'AkzoNobel Coatings ID'),
(5, 'AMPL-3M-P800', '899300400501', 'Amplas Kering Abrasive Sheet 3M Wetordry P800', 'Consumable', 'RAK-D1-01', 85, 20, 'Lembar', 6500.00, 12000.00, 'C', '3M Automotive Indonesia'),
(6, 'MASK-TAPE-3M', '899300400502', 'Masking Tape Kertas Cat High Temp 3M 24mm', 'Consumable', 'RAK-D1-04', 45, 15, 'Roll', 18500.00, 28000.00, 'C', '3M Automotive Indonesia');

-- Work Orders Seed
INSERT INTO `work_orders` (`id`, `wo_number`, `vehicle_id`, `service_advisor_id`, `foreman_id`, `type`, `status`, `priority`, `tracking_hash`, `complaints`, `total_estimated_cost`, `total_final_cost`) VALUES
(1, 'SPK-2026-0850', 1, 3, 4, 'Body Repair', 'Proses', 'High', 'a9b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4', 'Klaim Asuransi Garda Oto: Tabrakan sudut depan kanan, bumper penyok, fender sobek, headlamp pecah.', 8750000.00, 8750000.00),
(2, 'SPK-2026-0875', 2, 3, 4, 'Body Repair', 'Proses', 'Normal', 'b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6', 'Pengecatan 2 Panel: Pintu Depan Kanan & Fender Kanan baret dalam gesekan tiang parkir.', 2150000.00, 2150000.00);

-- Production Stages Seed
INSERT INTO `production_stages` (`work_order_id`, `stage_name`, `mechanic_id`, `status`, `sequence_order`, `notes`) VALUES
(1, 'Bongkar', 5, 'Completed', 1, 'Bongkar bumper depan dan bracket headlamp.'),
(1, 'Ketok', 5, 'Completed', 2, 'Tarik apron depan dan ketok dudukan fender.'),
(1, 'Dempul', 5, 'In Progress', 3, 'Perataan permukaan fender depan kanan.'),
(1, 'Cat', NULL, 'Pending', 4, 'Pengecatan warna 070 White Pearl 3 Stage.'),
(1, 'Poles', NULL, 'Pending', 5, 'Finishing poles 3M compound step 1-3.'),
(1, 'Pasang', NULL, 'Pending', 6, 'Perakitan panel dan kalibrasi sensor radar.');
