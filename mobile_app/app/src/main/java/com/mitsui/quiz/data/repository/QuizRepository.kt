package com.mitsui.quiz.data.repository

import com.mitsui.quiz.data.local.TokenManager
import com.mitsui.quiz.data.model.*
import com.mitsui.quiz.data.remote.ApiService
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class Resource<out T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val message: String) : Resource<Nothing>()
    object Loading : Resource<Nothing>()
}

@Singleton
class QuizRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    
    // Authentication
    suspend fun login(email: String, password: String): Resource<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                tokenManager.saveToken(loginResponse.token)
                tokenManager.saveUser(loginResponse.user)
                Resource.Success(loginResponse)
            } else {
                Resource.Error(response.errorBody()?.string() ?: "Login failed")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun register(
        email: String,
        password: String,
        name: String,
        facebookUrl: String
    ): Resource<LoginResponse> {
        return try {
            val response = apiService.register(
                RegisterRequest(email, password, name, facebookUrl)
            )
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                tokenManager.saveToken(loginResponse.token)
                tokenManager.saveUser(loginResponse.user)
                Resource.Success(loginResponse)
            } else {
                Resource.Error(response.errorBody()?.string() ?: "Registration failed")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun logout() {
        tokenManager.clearToken()
    }
    
    fun getUser(): Flow<User?> = tokenManager.getUser()
    
    fun getToken(): Flow<String?> = tokenManager.getToken()
    
    // Courses
    suspend fun getCourses(): Resource<List<Course>> {
        return try {
            val response = apiService.getCourses()
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to load courses")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun getCourseById(courseId: Int): Resource<Course> {
        return try {
            val response = apiService.getCourseById(courseId)
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to load course")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    // Quiz Package
    suspend fun getQuizPackage(packageId: Int): Resource<QuizPackage> {
        return try {
            val response = apiService.getQuizPackage(packageId)
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to load quiz package")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    // Quiz Operations
    suspend fun startQuiz(courseId: Int, quizPackageId: Int): Resource<StartQuizResponse> {
        return try {
            val response = apiService.startQuiz(StartQuizRequest(courseId, quizPackageId))
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to start quiz")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun submitAnswer(
        attemptId: Int,
        questionId: Int,
        answer: String
    ): Resource<Unit> {
        return try {
            val response = apiService.submitAnswer(
                SubmitAnswerRequest(attemptId, questionId, answer)
            )
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                Resource.Error("Failed to submit answer")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun completeQuiz(attemptId: Int): Resource<QuizResultResponse> {
        return try {
            val response = apiService.completeQuiz(attemptId)
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to complete quiz")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
    
    // Attempts
    suspend fun getAttempts(): Resource<List<Attempt>> {
        return try {
            val response = apiService.getAttempts()
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Failed to load attempts")
            }
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Network error")
        }
    }
}
