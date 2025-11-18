package com.mitsui.quiz.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mitsui.quiz.data.model.Course
import com.mitsui.quiz.data.repository.QuizRepository
import com.mitsui.quiz.data.repository.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CourseState {
    object Loading : CourseState()
    data class Success(val courses: List<Course>) : CourseState()
    data class Error(val message: String) : CourseState()
}

@HiltViewModel
class CourseViewModel @Inject constructor(
    private val repository: QuizRepository
) : ViewModel() {

    private val _courseState = MutableStateFlow<CourseState>(CourseState.Loading)
    val courseState: StateFlow<CourseState> = _courseState.asStateFlow()

    private val _selectedCourse = MutableStateFlow<Course?>(null)
    val selectedCourse: StateFlow<Course?> = _selectedCourse.asStateFlow()

    init {
        loadCourses()
    }

    fun loadCourses() {
        viewModelScope.launch {
            _courseState.value = CourseState.Loading
            
            when (val result = repository.getCourses()) {
                is Resource.Success -> {
                    result.data?.let { courses ->
                        _courseState.value = CourseState.Success(courses)
                    } ?: run {
                        _courseState.value = CourseState.Error("No courses found")
                    }
                }
                is Resource.Error -> {
                    _courseState.value = CourseState.Error(result.message ?: "Failed to load courses")
                }
                is Resource.Loading -> {
                    // Already set to loading
                }
            }
        }
    }

    fun selectCourse(course: Course) {
        _selectedCourse.value = course
    }

    fun getCourseById(courseId: Int) {
        viewModelScope.launch {
            when (val result = repository.getCourseById(courseId)) {
                is Resource.Success -> {
                    result.data?.let { course ->
                        _selectedCourse.value = course
                    }
                }
                is Resource.Error -> {
                    // Handle error if needed
                }
                is Resource.Loading -> {
                    // Handle loading if needed
                }
            }
        }
    }
}
