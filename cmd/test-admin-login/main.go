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
	fmt.Println("=== Test Admin Login ===")

	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Check if admin exists
	var user models.User
	if err := database.DB.Where("email = ? AND role = ?", "admin@mitsuki-jpy.com", models.RoleAdmin).First(&user).Error; err != nil {
		fmt.Println("❌ Admin user not found in database!")
		fmt.Println("Error:", err)
		return
	}

	fmt.Println("✅ Admin user found in database")
	fmt.Printf("ID: %d\n", user.ID)
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("Name: %s\n", user.Name)
	fmt.Printf("Role: %s\n", user.Role)
	fmt.Printf("Hashed Password: %s\n", user.Password)

	// Test password verification
	testPassword := "admin123"
	if utils.CheckPasswordHash(testPassword, user.Password) {
		fmt.Println("\n✅ Password verification PASSED")
		fmt.Println("Password 'admin123' matches the stored hash")
	} else {
		fmt.Println("\n❌ Password verification FAILED")
		fmt.Println("Password 'admin123' does NOT match the stored hash")
	}

	// Generate a test JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email, string(user.Role), cfg.JWTSecret, cfg.JWTExpireHours)
	if err != nil {
		fmt.Println("\n❌ Failed to generate JWT token:", err)
	} else {
		fmt.Println("\n✅ JWT token generated successfully")
		fmt.Printf("Token: %s\n", token[:50]+"...")
	}
}
