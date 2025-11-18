package com.mitsui.quiz.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class User(
    val id: Int,
    val email: String,
    val name: String,
    val role: String,
    val facebook_url: String? = null
) : Parcelable

@Parcelize
data class Course(
    val id: Int,
    val title: String,
    val description: String,
    val student_limit: Int,
    val retry_count: Int,
    val exam_time: Int,
    val quiz_packages: List<QuizPackage>? = null
) : Parcelable

@Parcelize
data class QuizPackage(
    val id: Int,
    val course_id: Int,
    val title: String,
    val description: String,
    val questions: List<Question>? = null
) : Parcelable

@Parcelize
data class Question(
    val id: Int,
    val quiz_package_id: Int,
    val question_text: String,
    val question_type: String, // "multiple_choice", "true_false", "short_answer"
    val options: List<String>? = null,
    val correct_answer: String,
    val points: Int
) : Parcelable

@Parcelize
data class Attempt(
    val id: Int,
    val student_id: Int,
    val course_id: Int,
    val quiz_package_id: Int,
    val status: String,
    val score: Int,
    val total_points: Int,
    val start_time: String,
    val end_time: String? = null,
    val answers: List<Answer>? = null
) : Parcelable

@Parcelize
data class Answer(
    val id: Int,
    val attempt_id: Int,
    val question_id: Int,
    val student_answer: String,
    val is_correct: Boolean,
    val points_earned: Int
) : Parcelable

// API Request/Response models
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val facebook_url: String
)

data class LoginResponse(
    val token: String,
    val user: User
)

data class StartQuizRequest(
    val course_id: Int,
    val quiz_package_id: Int
)

data class StartQuizResponse(
    val attempt_id: Int,
    val questions: List<Question>,
    val exam_time: Int
)

data class SubmitAnswerRequest(
    val attempt_id: Int,
    val question_id: Int,
    val answer: String
)

data class CompleteQuizRequest(
    val attempt_id: Int
)

data class QuizResultResponse(
    val score: Int,
    val total_points: Int,
    val percentage: Double,
    val correct: Int,
    val incorrect: Int,
    val time_taken: Int,
    val details: List<QuestionResult>
)

data class QuestionResult(
    val question_text: String,
    val student_answer: String,
    val correct_answer: String,
    val is_correct: Boolean,
    val points_earned: Int,
    val max_points: Int
)

data class ApiResponse<T>(
    val success: Boolean = true,
    val message: String? = null,
    val data: T? = null
)

data class ErrorResponse(
    val error: String
)
