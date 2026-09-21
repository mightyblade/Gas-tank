-- Migration script to update price_per_unit column from DECIMAL(10,2) to DECIMAL(10,4)
-- Run this script to update existing databases

ALTER TABLE fuel_entries MODIFY COLUMN price_per_unit DECIMAL(10,4) NOT NULL;