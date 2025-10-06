package models

import (
	"time"

	"gorm.io/gorm"
)

type AttemptStatus string

const (
	StatusInProgress AttemptStatus = "in_progress"
	StatusCompleted  AttemptStatus = "completed"
	StatusAbandoned  AttemptStatus = "abandoned"
)

type Attempt struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	StudentID     uint          `gorm:"not null" json:"student_id"`
	CourseID      uint          `gorm:"not null" json:"course_id"`
	QuizPackageID uint          `gorm:"not null" json:"quiz_package_id"`
	Status        AttemptStatus `gorm:"type:varchar(20);default:'in_progress'" json:"status"`

	StartTime    time.Time  `json:"start_time"`
	EndTime      *time.Time `json:"end_time,omitempty"`
	Score        int        `gorm:"default:0" json:"score"`
	TotalPoints  int        `gorm:"default:0" json:"total_points"`
	AttemptCount int        `gorm:"default:1" json:"attempt_count"` // Which attempt number (1, 2, 3...)

	Answers []Answer `gorm:"foreignKey:AttemptID" json:"answers,omitempty"`
}

// TableName specifies the table name for Attempt model
func (Attempt) TableName() string {
	return "attempts"
}

type Answer struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	AttemptID     uint   `gorm:"not null" json:"attempt_id"`
	QuestionID    uint   `gorm:"not null" json:"question_id"`
	StudentAnswer string `gorm:"type:text" json:"student_answer"`
	IsCorrect     bool   `gorm:"default:false" json:"is_correct"`
	PointsEarned  int    `gorm:"default:0" json:"points_earned"`
}

// TableName specifies the table name for Answer model
func (Answer) TableName() string {
	return "answers"
}
