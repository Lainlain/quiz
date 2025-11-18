package models

import (
	"time"

	"gorm.io/gorm"
)

type EnrollmentStatus string

const (
	EnrollmentPending  EnrollmentStatus = "pending"
	EnrollmentApproved EnrollmentStatus = "approved"
	EnrollmentDeclined EnrollmentStatus = "declined"
)

// Enrollment represents a student's registration in a course
type Enrollment struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	StudentID uint             `gorm:"not null;index" json:"student_id"`
	CourseID  uint             `gorm:"not null;index" json:"course_id"`
	Status    EnrollmentStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`

	// Relationships
	Student User   `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Course  Course `gorm:"foreignKey:CourseID" json:"course,omitempty"`
}

// TableName specifies the table name for Enrollment model
func (Enrollment) TableName() string {
	return "enrollments"
}
