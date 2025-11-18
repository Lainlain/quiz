package com.mitsui.quiz.data.remote

import com.mitsui.quiz.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication
    @POST("api/auth/student/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("api/auth/student/register")
    suspend fun register(@Body request: RegisterRequest): Response<LoginResponse>
    
    // Courses
    @GET("api/student/courses")
    suspend fun getCourses(): Response<List<Course>>
    
    @GET("api/student/courses/{id}")
    suspend fun getCourseById(@Path("id") courseId: Int): Response<Course>
    
    // Quiz Packages
    @GET("api/student/quiz-packages/{id}")
    suspend fun getQuizPackage(@Path("id") packageId: Int): Response<QuizPackage>
    
    // Quiz Operations
    @POST("api/student/quiz/start")
    suspend fun startQuiz(@Body request: StartQuizRequest): Response<StartQuizResponse>
    
    @POST("api/student/quiz/answer")
    suspend fun submitAnswer(@Body request: SubmitAnswerRequest): Response<ApiResponse<Unit>>
    
    @POST("api/student/quiz/complete/{attemptId}")
    suspend fun completeQuiz(@Path("attemptId") attemptId: Int): Response<QuizResultResponse>
    
    // Attempts
    @GET("api/student/attempts")
    suspend fun getAttempts(): Response<List<Attempt>>
    
    @GET("api/student/attempts/{id}")
    suspend fun getAttemptById(@Path("id") attemptId: Int): Response<Attempt>
}
