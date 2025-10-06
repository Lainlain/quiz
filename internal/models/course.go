package models

import (
	"time"

	"gorm.io/gorm"
)

type Course struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Title        string `gorm:"not null" json:"title"`
	Description  string `gorm:"type:text" json:"description"`
	StudentLimit int    `gorm:"not null;default:50" json:"student_limit"` // Max students per course
	RetryCount   int    `gorm:"not null;default:3" json:"retry_count"`    // How many times student can retry
	ExamTime     int    `gorm:"not null;default:60" json:"exam_time"`     // Exam time in minutes
	IsActive     bool   `gorm:"default:true" json:"is_active"`

	QuizPackages []QuizPackage `gorm:"foreignKey:CourseID" json:"quiz_packages,omitempty"`
}

// TableName specifies the table name for Course model
func (Course) TableName() string {
	return "courses"
}
