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

	Email    string   `gorm:"unique;not null" json:"email"`
	Password string   `gorm:"not null" json:"-"`
	Name     string   `gorm:"not null" json:"name"`
	Role     UserRole `gorm:"type:varchar(20);not null" json:"role"`

	// For students
	Attempts []Attempt `gorm:"foreignKey:StudentID" json:"attempts,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}
