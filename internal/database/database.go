package database

import (
	"log"
	"mitsui-jpy-quiz/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(databaseURL string) error {
	var err error

	DB, err = gorm.Open(sqlite.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return err
	}

	log.Println("Database connection established")
	return nil
}

func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Course{},
		&models.QuizPackage{},
		&models.Question{},
		&models.Attempt{},
		&models.Answer{},
		&models.Enrollment{},
	)

	if err != nil {
		return err
	}

	log.Println("Database migration completed")
	return nil
}
