package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleStudent UserRole = "student"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Email       string   `gorm:"unique;not null" json:"email"`
	Password    string   `gorm:"not null" json:"-"`
	Name        string   `gorm:"not null" json:"name"`
	PhoneNumber string   `gorm:"type:varchar(20)" json:"phone_number"`
	Address     string   `gorm:"type:text" json:"address"`
	City        string   `gorm:"type:varchar(100)" json:"city"`
	PostalCode  string   `gorm:"type:varchar(20)" json:"postal_code"`
	FacebookURL string   `gorm:"type:varchar(255)" json:"facebook_url"`
	Role        UserRole `gorm:"type:varchar(20);not null" json:"role"`

	// For students
	Attempts []Attempt `gorm:"foreignKey:StudentID" json:"attempts,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}
