package models

import (
	"time"

	"gorm.io/gorm"
)

type QuizPackage struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	CourseID    uint   `gorm:"not null" json:"course_id"`
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`

	// Maximum number of retakes allowed per student for this package
	MaxRetakeCount int `gorm:"default:1" json:"max_retake_count"`

	Questions []Question `gorm:"foreignKey:QuizPackageID" json:"questions,omitempty"`
}

// TableName specifies the table name for QuizPackage model
func (QuizPackage) TableName() string {
	return "quiz_packages"
}
