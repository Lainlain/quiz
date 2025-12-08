package main

import (
	"fmt"
	"log"
	"mitsuki-jpy-quiz/config"
	"mitsuki-jpy-quiz/internal/database"
	"mitsuki-jpy-quiz/internal/models"
	"mitsuki-jpy-quiz/pkg/utils"
)

func main() {
	fmt.Println("=== Fix Admin User ===")

	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Find admin user
	var admin models.User
	err := database.DB.Where("email = ?", "admin@mitsuki-jpy.com").First(&admin).Error
	if err != nil {
		fmt.Println("❌ Admin user not found!")
		fmt.Println("Creating new admin user...")

		// Hash password
		hashedPassword, err := utils.HashPassword("admin123")
		if err != nil {
			log.Fatal("Failed to hash password:", err)
		}

		// Create admin user
		admin = models.User{
			Email:       "admin@mitsuki-jpy.com",
			Password:    hashedPassword,
			Name:        "Admin User",
			PhoneNumber: "0000000000",
			Role:        models.RoleAdmin,
		}

		if err := database.DB.Create(&admin).Error; err != nil {
			log.Fatal("Failed to create admin:", err)
		}

		fmt.Println("✅ Admin user created successfully!")
	} else {
		fmt.Println("Admin user found. Updating...")

		// Update phone number if empty
		if admin.PhoneNumber == "" {
			admin.PhoneNumber = "0000000000"
			fmt.Println("→ Adding phone number: 0000000000")
		}

		// Reset password to admin123
		hashedPassword, err := utils.HashPassword("admin123")
		if err != nil {
			log.Fatal("Failed to hash password:", err)
		}
		admin.Password = hashedPassword
		fmt.Println("→ Resetting password to: admin123")

		// Save changes
		if err := database.DB.Save(&admin).Error; err != nil {
			log.Fatal("Failed to update admin:", err)
		}

		fmt.Println("✅ Admin user updated successfully!")
	}

	fmt.Println("\n📋 Admin Login Credentials:")
	fmt.Println("Email: admin@mitsuki-jpy.com")
	fmt.Println("Password: admin123")
	fmt.Println("Phone: 0000000000")
	fmt.Println("\n⚠️  Please change the password after first login!")
}
