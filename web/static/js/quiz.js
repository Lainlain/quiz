// Quiz Application Alpine.js Component
function quizApp() {
    return {
        // Quiz metadata
        courseId: null,
        courseName: '',
        quizPackageId: null,
        quizPackageName: '',
        examTime: 0,
        
        // Student info
        studentName: '',
        
        // Quiz state
        currentScreen: 'name', // 'name', 'quiz', 'results'
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        
        // Timer
        timeRemaining: 0,
        timerInterval: null,
        startTime: null,
        
        // Results
        results: {
            score: 0,
            totalPoints: 0,
            percentage: 0,
            correct: 0,
            incorrect: 0,
            timeTaken: 0,
            details: []
        },
        
        // Initialize
        async init() {
            // Get quiz package ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.quizPackageId = urlParams.get('package');
            
            if (!this.quizPackageId) {
                alert('Invalid quiz link');
                return;
            }
            
            await this.loadQuizData();
        },
        
        // Load quiz data
        async loadQuizData() {
            try {
                // Load quiz package details
                const pkgResponse = await fetch(`/api/student/quiz-packages/${this.quizPackageId}`);
                const pkgData = await pkgResponse.json();
                
                this.quizPackageName = pkgData.title;
                
                // Load course details
                const courseResponse = await fetch(`/api/student/courses/${pkgData.course_id}`);
                const courseData = await courseResponse.json();
                
                this.courseId = courseData.id;
                this.courseName = courseData.title;
                this.examTime = courseData.exam_time;
                
                // Load questions
                const questionsResponse = await fetch(`/api/student/questions/package/${this.quizPackageId}`);
                this.questions = await questionsResponse.json();
                
                // Initialize answers array
                this.answers = new Array(this.questions.length).fill(null);
                
                // Parse options for multiple choice questions
                this.questions = this.questions.map(q => {
                    if (q.question_type === 'multiple_choice' && typeof q.options === 'string') {
                        try {
                            q.options = JSON.parse(q.options);
                        } catch (e) {
                            q.options = [];
                        }
                    }
                    return q;
                });
            } catch (error) {
                console.error('Error loading quiz data:', error);
                alert('Failed to load quiz. Please try again.');
            }
        },
        
        // Computed properties
        get currentQuestion() {
            return this.questions[this.currentQuestionIndex];
        },
        
        get totalQuestions() {
            return this.questions.length;
        },
        
        get totalPoints() {
            return this.questions.reduce((sum, q) => sum + q.points, 0);
        },
        
        // Start quiz
        startQuiz() {
            if (!this.studentName.trim()) {
                alert('Please enter your name');
                return;
            }
            
            this.currentScreen = 'quiz';
            this.timeRemaining = this.examTime * 60; // Convert to seconds
            this.startTime = Date.now();
            this.startTimer();
        },
        
        // Timer
        startTimer() {
            this.timerInterval = setInterval(() => {
                this.timeRemaining--;
                
                if (this.timeRemaining <= 0) {
                    this.timeUp();
                }
            }, 1000);
        },
        
        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        },
        
        timeUp() {
            this.stopTimer();
            alert('Time is up! Submitting your quiz...');
            this.submitQuiz();
        },
        
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        // Navigation
        nextQuestion() {
            if (this.currentQuestionIndex < this.totalQuestions - 1) {
                this.currentQuestionIndex++;
            }
        },
        
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },
        
        goToQuestion(index) {
            this.currentQuestionIndex = index;
        },
        
        // Submit quiz
        async submitQuiz() {
            if (!confirm('Are you sure you want to submit your quiz? You cannot change your answers after submission.')) {
                return;
            }
            
            this.stopTimer();
            const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
            
            // Calculate results
            let score = 0;
            let correct = 0;
            let incorrect = 0;
            const details = [];
            
            this.questions.forEach((question, index) => {
                const userAnswer = this.answers[index];
                const correctAnswer = question.correct_answer;
                const isCorrect = userAnswer && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                
                if (isCorrect) {
                    score += question.points;
                    correct++;
                } else {
                    incorrect++;
                }
                
                details.push({
                    questionId: question.id,
                    userAnswer: userAnswer || '',
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                    pointsEarned: isCorrect ? question.points : 0
                });
            });
            
            const percentage = Math.round((score / this.totalPoints) * 100);
            
            this.results = {
                score,
                totalPoints: this.totalPoints,
                percentage,
                correct,
                incorrect,
                timeTaken,
                details
            };
            
            // Save attempt to backend
            await this.saveAttempt();
            
            this.currentScreen = 'results';
        },
        
        // Save attempt to backend
        async saveAttempt() {
            try {
                const response = await fetch('/api/quiz/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        student_name: this.studentName,
                        course_id: this.course.id,
                        quiz_package_id: this.quizPackage.id,
                        score: this.results.score,
                        total_points: this.results.totalPoints,
                        time_taken: this.results.timeTaken,
                        answers: this.results.details.map(detail => ({
                            question_id: detail.questionId,
                            user_answer: detail.userAnswer,
                            is_correct: detail.isCorrect,
                            points_earned: detail.pointsEarned
                        }))
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Attempt saved successfully:', data);
                } else {
                    console.error('Failed to save attempt');
                }
            } catch (error) {
                console.error('Error saving attempt:', error);
            }
        },
        
        // Print results
        printResults() {
            window.print();
        },
        
        // Restart quiz
        restartQuiz() {
            if (confirm('Are you sure you want to retake the quiz? Your current results will be lost.')) {
                this.currentScreen = 'name';
                this.studentName = '';
                this.currentQuestionIndex = 0;
                this.answers = new Array(this.questions.length).fill(null);
                this.timeRemaining = 0;
                this.results = {
                    score: 0,
                    totalPoints: 0,
                    percentage: 0,
                    correct: 0,
                    incorrect: 0,
                    timeTaken: 0,
                    details: []
                };
            }
        }
    };
}
