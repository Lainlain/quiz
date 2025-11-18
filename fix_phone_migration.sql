-- Fix phone_number migration for existing database
-- Run this on your server database

-- Step 1: Add phone_number column as nullable first
ALTER TABLE users ADD COLUMN phone_number varchar(20);

-- Step 2: Update existing admin users with a default phone number
UPDATE users SET phone_number = '000000000' WHERE role = 'admin' AND phone_number IS NULL;

-- Step 3: Update existing student users with their email as temporary phone
-- (You should manually update these with real phone numbers later)
UPDATE users SET phone_number = substr(email, 1, instr(email, '@') - 1) WHERE role = 'student' AND phone_number IS NULL;

-- Step 4: Now you can rebuild the application and it will work
-- The GORM migration will then properly set the column as NOT NULL with default value
