package com.mitsui.quiz.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mitsui.quiz.data.model.LoginResponse
import com.mitsui.quiz.data.model.User
import com.mitsui.quiz.data.repository.QuizRepository
import com.mitsui.quiz.data.repository.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val user: User, val token: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val repository: QuizRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    init {
        checkLoginStatus()
    }

    private fun checkLoginStatus() {
        viewModelScope.launch {
            repository.getToken().collect { token ->
                _isLoggedIn.value = !token.isNullOrEmpty()
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            
            when (val result = repository.login(email, password)) {
                is Resource.Success -> {
                    result.data?.let { response ->
                        _authState.value = AuthState.Success(response.user, response.token)
                        _isLoggedIn.value = true
                    } ?: run {
                        _authState.value = AuthState.Error("Login failed: No data received")
                    }
                }
                is Resource.Error -> {
                    _authState.value = AuthState.Error(result.message ?: "Login failed")
                }
                is Resource.Loading -> {
                    // Already set to loading
                }
            }
        }
    }

    fun register(email: String, password: String, name: String, facebookUrl: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            
            // Validate Facebook URL
            if (facebookUrl.isBlank()) {
                _authState.value = AuthState.Error("Facebook URL is required")
                return@launch
            }
            
            if (!isValidFacebookUrl(facebookUrl)) {
                _authState.value = AuthState.Error("Please enter a valid Facebook profile URL")
                return@launch
            }
            
            when (val result = repository.register(email, password, name, facebookUrl)) {
                is Resource.Success -> {
                    result.data?.let { response ->
                        _authState.value = AuthState.Success(response.user, response.token)
                        _isLoggedIn.value = true
                    } ?: run {
                        _authState.value = AuthState.Error("Registration failed: No data received")
                    }
                }
                is Resource.Error -> {
                    _authState.value = AuthState.Error(result.message ?: "Registration failed")
                }
                is Resource.Loading -> {
                    // Already set to loading
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _authState.value = AuthState.Idle
            _isLoggedIn.value = false
        }
    }

    fun resetAuthState() {
        _authState.value = AuthState.Idle
    }

    private fun isValidFacebookUrl(url: String): Boolean {
        return url.contains("facebook.com", ignoreCase = true) ||
               url.contains("fb.com", ignoreCase = true) ||
               url.contains("fb.me", ignoreCase = true)
    }
}
