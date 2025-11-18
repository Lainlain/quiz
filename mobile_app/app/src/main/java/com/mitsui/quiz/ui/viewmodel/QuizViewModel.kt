package com.mitsui.quiz.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mitsui.quiz.data.model.Answer
import com.mitsui.quiz.data.model.Question
import com.mitsui.quiz.data.model.QuizResultResponse
import com.mitsui.quiz.data.model.StartQuizResponse
import com.mitsui.quiz.data.repository.QuizRepository
import com.mitsui.quiz.data.repository.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class QuizState {
    object Idle : QuizState()
    object Loading : QuizState()
    data class Started(
        val attemptId: Int,
        val questions: List<Question>,
        val examTime: Int
    ) : QuizState()
    data class Completed(val result: QuizResultResponse) : QuizState()
    data class Error(val message: String) : QuizState()
}

@HiltViewModel
class QuizViewModel @Inject constructor(
    private val repository: QuizRepository
) : ViewModel() {

    private val _quizState = MutableStateFlow<QuizState>(QuizState.Idle)
    val quizState: StateFlow<QuizState> = _quizState.asStateFlow()

    private val _currentQuestionIndex = MutableStateFlow(0)
    val currentQuestionIndex: StateFlow<Int> = _currentQuestionIndex.asStateFlow()

    private val _answers = MutableStateFlow<Map<Int, String>>(emptyMap())
    val answers: StateFlow<Map<Int, String>> = _answers.asStateFlow()

    private val _timeRemaining = MutableStateFlow(0)
    val timeRemaining: StateFlow<Int> = _timeRemaining.asStateFlow()

    private var timerJob: Job? = null
    private var currentAttemptId: Int? = null
    private var questions: List<Question> = emptyList()

    fun startQuiz(courseId: Int, quizPackageId: Int) {
        viewModelScope.launch {
            _quizState.value = QuizState.Loading
            
            when (val result = repository.startQuiz(courseId, quizPackageId)) {
                is Resource.Success -> {
                    result.data?.let { response ->
                        currentAttemptId = response.attemptId
                        questions = response.questions
                        _quizState.value = QuizState.Started(
                            attemptId = response.attemptId,
                            questions = response.questions,
                            examTime = response.examTime
                        )
                        _timeRemaining.value = response.examTime * 60 // Convert to seconds
                        _currentQuestionIndex.value = 0
                        _answers.value = emptyMap()
                        startTimer()
                    } ?: run {
                        _quizState.value = QuizState.Error("Failed to start quiz")
                    }
                }
                is Resource.Error -> {
                    _quizState.value = QuizState.Error(result.message ?: "Failed to start quiz")
                }
                is Resource.Loading -> {
                    // Already set to loading
                }
            }
        }
    }

    fun answerQuestion(questionId: Int, answer: String) {
        viewModelScope.launch {
            currentAttemptId?.let { attemptId ->
                // Update local answers map
                _answers.value = _answers.value + (questionId to answer)
                
                // Submit answer to server
                repository.submitAnswer(attemptId, questionId, answer)
            }
        }
    }

    fun goToQuestion(index: Int) {
        if (index in questions.indices) {
            _currentQuestionIndex.value = index
        }
    }

    fun nextQuestion() {
        if (_currentQuestionIndex.value < questions.size - 1) {
            _currentQuestionIndex.value++
        }
    }

    fun previousQuestion() {
        if (_currentQuestionIndex.value > 0) {
            _currentQuestionIndex.value--
        }
    }

    fun completeQuiz() {
        viewModelScope.launch {
            stopTimer()
            currentAttemptId?.let { attemptId ->
                _quizState.value = QuizState.Loading
                
                when (val result = repository.completeQuiz(attemptId)) {
                    is Resource.Success -> {
                        result.data?.let { resultResponse ->
                            _quizState.value = QuizState.Completed(resultResponse)
                        } ?: run {
                            _quizState.value = QuizState.Error("Failed to get quiz result")
                        }
                    }
                    is Resource.Error -> {
                        _quizState.value = QuizState.Error(result.message ?: "Failed to complete quiz")
                    }
                    is Resource.Loading -> {
                        // Already set to loading
                    }
                }
            }
        }
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (_timeRemaining.value > 0) {
                delay(1000)
                _timeRemaining.value--
            }
            // Time's up - auto-complete quiz
            completeQuiz()
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
    }

    fun getUnansweredQuestions(): List<Int> {
        return questions.mapIndexedNotNull { index, question ->
            if (!_answers.value.containsKey(question.id)) index else null
        }
    }

    fun resetQuiz() {
        stopTimer()
        _quizState.value = QuizState.Idle
        _currentQuestionIndex.value = 0
        _answers.value = emptyMap()
        _timeRemaining.value = 0
        currentAttemptId = null
        questions = emptyList()
    }

    override fun onCleared() {
        super.onCleared()
        stopTimer()
    }
}
