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
	fmt.Println("=== Create Admin User ===")

	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Check if admin already exists
	var existingAdmin models.User
	err := database.DB.Where("email = ?", "admin@mitsuki-jpy.com").First(&existingAdmin).Error
	if err == nil {
		fmt.Println("Admin user already exists!")
		fmt.Printf("Email: %s\n", existingAdmin.Email)
		fmt.Printf("Name: %s\n", existingAdmin.Name)
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword("admin123")
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	// Create admin user
	admin := models.User{
		Email:       "admin@mitsuki-jpy.com",
		Password:    hashedPassword,
		Name:        "Admin User",
		PhoneNumber: "0000000000",
		Role:        models.RoleAdmin,
	}

	if err := database.DB.Create(&admin).Error; err != nil {
		log.Fatal("Failed to create admin:", err)
	}

	fmt.Println("\n✅ Admin user created successfully!")
	fmt.Println("\nLogin credentials:")
	fmt.Println("Email: admin@mitsuki-jpy.com")
	fmt.Println("Password: admin123")
	fmt.Println("Phone: 0000000000 (admin default)")
	fmt.Println("\n⚠️  Please change the password after first login!")
}
