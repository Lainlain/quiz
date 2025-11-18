package com.mitsui.quiz.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mitsui.quiz.data.model.Question
import com.mitsui.quiz.ui.viewmodel.QuizState
import com.mitsui.quiz.ui.viewmodel.QuizViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizScreen(
    courseId: Int,
    quizPackageId: Int,
    onQuizComplete: () -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: QuizViewModel = hiltViewModel()
) {
    val quizState by viewModel.quizState.collectAsState()
    val currentQuestionIndex by viewModel.currentQuestionIndex.collectAsState()
    val answers by viewModel.answers.collectAsState()
    val timeRemaining by viewModel.timeRemaining.collectAsState()
    
    var showCompleteDialog by remember { mutableStateOf(false) }
    var showUnansweredDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        if (quizState is QuizState.Idle) {
            viewModel.startQuiz(courseId, quizPackageId)
        }
    }
    
    LaunchedEffect(quizState) {
        if (quizState is QuizState.Completed) {
            onQuizComplete()
        }
    }
    
    if (showCompleteDialog) {
        AlertDialog(
            onDismissRequest = { showCompleteDialog = false },
            title = { Text("Complete Quiz") },
            text = { Text("Are you sure you want to submit your quiz?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showCompleteDialog = false
                        viewModel.completeQuiz()
                    }
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCompleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
    
    if (showUnansweredDialog) {
        val unanswered = viewModel.getUnansweredQuestions()
        AlertDialog(
            onDismissRequest = { showUnansweredDialog = false },
            title = { Text("Unanswered Questions") },
            text = { 
                Text("You have ${unanswered.size} unanswered question(s). Do you want to submit anyway?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showUnansweredDialog = false
                        viewModel.completeQuiz()
                    }
                ) {
                    Text("Submit Anyway")
                }
            },
            dismissButton = {
                TextButton(onClick = { showUnansweredDialog = false }) {
                    Text("Review")
                }
            }
        )
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Timer,
                            contentDescription = "Timer",
                            tint = if (timeRemaining < 300) MaterialTheme.colorScheme.error 
                                   else MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(formatTime(timeRemaining))
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        when (val state = quizState) {
            is QuizState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            
            is QuizState.Started -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // Progress indicator
                    LinearProgressIndicator(
                        progress = (currentQuestionIndex + 1) / state.questions.size.toFloat(),
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    // Question content
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Question ${currentQuestionIndex + 1} of ${state.questions.size}",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        val currentQuestion = state.questions[currentQuestionIndex]
                        Text(
                            text = currentQuestion.question,
                            style = MaterialTheme.typography.headlineSmall
                        )
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        // Answer options
                        AnswerOptions(
                            question = currentQuestion,
                            selectedAnswer = answers[currentQuestion.id],
                            onAnswerSelected = { answer ->
                                viewModel.answerQuestion(currentQuestion.id, answer)
                            }
                        )
                    }
                    
                    // Navigation buttons
                    Surface(
                        shadowElevation = 8.dp
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.previousQuestion() },
                                enabled = currentQuestionIndex > 0
                            ) {
                                Icon(Icons.Default.ArrowBack, contentDescription = null)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Previous")
                            }
                            
                            if (currentQuestionIndex < state.questions.size - 1) {
                                Button(
                                    onClick = { viewModel.nextQuestion() }
                                ) {
                                    Text("Next")
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(Icons.Default.ArrowForward, contentDescription = null)
                                }
                            } else {
                                Button(
                                    onClick = {
                                        val unanswered = viewModel.getUnansweredQuestions()
                                        if (unanswered.isNotEmpty()) {
                                            showUnansweredDialog = true
                                        } else {
                                            showCompleteDialog = true
                                        }
                                    }
                                ) {
                                    Text("Submit")
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(Icons.Default.Check, contentDescription = null)
                                }
                            }
                        }
                    }
                }
            }
            
            is QuizState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer
                            )
                        ) {
                            Text(
                                text = state.message,
                                modifier = Modifier.padding(16.dp),
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onNavigateBack) {
                            Text("Go Back")
                        }
                    }
                }
            }
            
            else -> {
                // Idle or Completed state (handled by LaunchedEffect)
            }
        }
    }
}

@Composable
fun AnswerOptions(
    question: Question,
    selectedAnswer: String?,
    onAnswerSelected: (String) -> Unit
) {
    val options = listOfNotNull(
        question.optionA?.let { "A" to it },
        question.optionB?.let { "B" to it },
        question.optionC?.let { "C" to it },
        question.optionD?.let { "D" to it }
    )
    
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        options.forEach { (letter, text) ->
            AnswerOption(
                letter = letter,
                text = text,
                selected = selectedAnswer == letter,
                onClick = { onAnswerSelected(letter) }
            )
        }
    }
}

@Composable
fun AnswerOption(
    letter: String,
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(
                selected = selected,
                onClick = onClick,
                role = Role.RadioButton
            ),
        shape = MaterialTheme.shapes.medium,
        color = if (selected) MaterialTheme.colorScheme.primaryContainer 
                else MaterialTheme.colorScheme.surface,
        border = ButtonDefaults.outlinedButtonBorder,
        tonalElevation = if (selected) 2.dp else 0.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = selected,
                onClick = onClick
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = letter,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected) MaterialTheme.colorScheme.primary 
                            else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer 
                            else MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

fun formatTime(seconds: Int): String {
    val minutes = seconds / 60
    val secs = seconds % 60
    return String.format("%02d:%02d", minutes, secs)
}
