package models

import (
	"time"

	"gorm.io/gorm"
)

type QuestionType string

const (
	TypeMultipleChoice QuestionType = "multiple_choice"
	TypeTrueFalse      QuestionType = "true_false"
	TypeShortAnswer    QuestionType = "short_answer"
)

type Question struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	QuizPackageID uint         `gorm:"not null" json:"quiz_package_id"`
	QuestionText  string       `gorm:"type:text;not null" json:"question_text"`
	QuestionType  QuestionType `gorm:"type:varchar(50);not null" json:"question_type"`
	ImageURL      string       `gorm:"type:varchar(500)" json:"image_url"` // Optional image for the question

	// For multiple choice questions (stored as JSON)
	Options       string `gorm:"type:json" json:"options"`       // JSON array: ["Option A", "Option B", "Option C", "Option D"]
	CorrectAnswer string `gorm:"not null" json:"correct_answer"` // For multiple choice: "A", "B", etc. For true/false: "true"/"false"

	Points      int  `gorm:"not null" json:"points"`                // Manual points per question (no default)
	OrderNumber int  `gorm:"default:0" json:"order_number"` // For ordering questions in quiz
	IsActive    bool `gorm:"default:true" json:"is_active"`
}

// TableName specifies the table name for Question model
func (Question) TableName() string {
	return "questions"
}
