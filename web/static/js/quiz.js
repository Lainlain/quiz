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
        phoneNumber: '',
        studentId: null,
        retakeInfo: null, // Contains current_attempts, max_retakes, attempts_remaining, quiz_package_name
        
        // Loading state
        isLoading: true,
        
        // Modal state
        modal: {
            show: false,
            type: 'info', // 'success', 'error', 'warning', 'info'
            title: '',
            message: ''
        },
        
        // Previous attempt data (for blocked screen)
        previousAttempt: {
            score: 0,
            total_points: 0,
            time_taken: 0,
            completed_at: null,
            total_questions: 0,
            percentage: 0
        },
        
        // Quiz state
        currentScreen: 'name', // 'name', 'quiz', 'results', 'blocked'
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
        
        // Modal helper functions
        showModal(type, title, message) {
            this.modal = { show: true, type, title, message };
        },
        
        closeModal() {
            this.modal.show = false;
        },
        
        // Initialize
        async init() {
            try {
                // Get quiz package ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                this.quizPackageId = parseInt(urlParams.get('package'));
                
                if (!this.quizPackageId) {
                    this.showModal('error', 'Invalid Link', 'This quiz link is invalid. Please check the URL.');
                    this.isLoading = false;
                    return;
                }
                
                await this.loadQuizData();
                
                // Data loaded, hide loading state
                this.isLoading = false;
                console.log('Quiz initialization complete');
            } catch (error) {
                console.error('Initialization error:', error);
                this.isLoading = false;
                this.showModal('error', 'Loading Failed', 'Failed to load quiz. Please refresh the page and try again.');
            }
        },
        
        // Load quiz data
        async loadQuizData() {
            try {
                console.log('Loading quiz data for package:', this.quizPackageId);
                
                // Load quiz package details
                const pkgResponse = await fetch(`/api/student/quiz-packages/${this.quizPackageId}`);
                if (!pkgResponse.ok) {
                    throw new Error(`Failed to load quiz package: ${pkgResponse.status}`);
                }
                const pkgData = await pkgResponse.json();
                
                this.quizPackageName = pkgData.title;
                console.log('Quiz Package:', pkgData);
                
                // Load course details
                const courseResponse = await fetch(`/api/student/courses/${pkgData.course_id}`);
                if (!courseResponse.ok) {
                    throw new Error(`Failed to load course: ${courseResponse.status}`);
                }
                const courseData = await courseResponse.json();
                
                this.courseId = courseData.id;
                this.courseName = courseData.title;
                this.examTime = courseData.exam_time;
                
                console.log('Course Data:', courseData);
                console.log('Exam Time:', this.examTime, 'minutes');
                
                // Load questions
                const questionsResponse = await fetch(`/api/student/questions/package/${this.quizPackageId}`);
                if (!questionsResponse.ok) {
                    throw new Error(`Failed to load questions: ${questionsResponse.status}`);
                }
                this.questions = await questionsResponse.json();
                
                console.log('Questions loaded:', this.questions.length);
                
                // Initialize answers array
                this.answers = new Array(this.questions.length).fill(null);
                
                // Parse options for multiple choice questions and log image info
                this.questions = this.questions.map(q => {
                    if (q.question_type === 'multiple_choice' && typeof q.options === 'string') {
                        try {
                            q.options = JSON.parse(q.options);
                        } catch (e) {
                            q.options = [];
                        }
                    }
                    
                    // Log image URLs for debugging
                    if (q.image_url) {
                        console.log(`Question ${q.id}: "${q.question_text}" has image: ${q.image_url}`);
                    }
                    
                    return q;
                });
                
                console.log('Quiz data loaded successfully');
            } catch (error) {
                console.error('Error loading quiz data:', error);
                this.showModal('error', 'Loading Error', 'Failed to load quiz data. Please check your connection and try again.');
                throw error; // Re-throw to be caught by init()
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
        
        // Verify phone number before starting quiz
        async verifyPhoneNumber() {
            if (!this.phoneNumber.trim()) {
                this.showModal('warning', 'Phone Number Required', 'Please enter your phone number to continue.');
                return;
            }
            
            try {
                this.isLoading = true;
                
                // Check if phone number is approved for this course and quiz package
                const response = await fetch(`/api/quiz/check-phone?course_id=${this.courseId}&phone_number=${encodeURIComponent(this.phoneNumber)}&quiz_package_id=${this.quizPackageId}`);
                const data = await response.json();
                
                if (!response.ok) {
                    this.showModal('error', 'Error', data.error || 'Failed to verify phone number. Please try again.');
                    this.isLoading = false;
                    return;
                }
                
                if (!data.approved) {
                    // Check if it's a retake limit issue
                    if (data.retake_limit_reached) {
                        const retakeInfo = data.retake_info;
                        this.showModal('error', 'Quiz Retake Limit Reached', 
                            `You have already taken this quiz ${retakeInfo.current_attempts} time(s), which is the maximum allowed (${retakeInfo.max_retakes}). No more attempts are permitted.`);
                    } else {
                        // Other approval issues (not registered, pending, declined, etc.)
                        this.showModal('error', 'Not Approved', data.message || 'You are not approved to take this quiz.');
                    }
                    this.isLoading = false;
                    return;
                }
                
                // Approved - save student info and retake information
                this.studentId = data.student_id;
                this.studentName = data.student_name;
                this.retakeInfo = data.retake_info || null;
                
                console.log('Phone number verified. Student:', this.studentName);
                if (this.retakeInfo) {
                    console.log('Retake info:', this.retakeInfo);
                }
                
                this.isLoading = false;
                this.startQuiz();
                
            } catch (error) {
                console.error('Error verifying phone number:', error);
                this.showModal('error', 'Verification Failed', 'Failed to verify your phone number. Please check your connection and try again.');
                this.isLoading = false;
            }
        },
        
        // Start quiz
        startQuiz() {
            // Validate exam time
            if (!this.examTime || this.examTime <= 0) {
                this.showModal('error', 'Configuration Error', 'Invalid exam time detected. Please contact the administrator.');
                console.error('Invalid exam time:', this.examTime);
                return;
            }
            
            console.log('Starting quiz with exam time:', this.examTime, 'minutes');
            
            this.currentScreen = 'quiz';
            this.timeRemaining = this.examTime * 60; // Convert to seconds
            this.startTime = Date.now();
            
            console.log('Time remaining (seconds):', this.timeRemaining);
            
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
            this.showModal('warning', 'Time is Up!', 'Your time has expired. The quiz will be submitted automatically.');
            setTimeout(() => {
                this.closeModal();
                this.submitQuiz();
            }, 2000);
        },
        
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        // Navigation
        nextQuestion() {
            // Check if current question is answered
            const currentAnswer = this.answers[this.currentQuestionIndex];
            if (currentAnswer == null || currentAnswer === '') {
                this.showModal('warning', 'Question Not Answered', 
                    `Question ${this.currentQuestionIndex + 1} has no answer selected. Please select an answer or you can skip it and come back later.`);
            }
            
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
        
        // Helper to count unanswered questions
        get unansweredCount() {
            return this.answers.filter(a => a == null || a === '').length;
        },
        
        // Submit quiz
        async submitQuiz() {
            // Check for unanswered questions first
            const unansweredCount = this.unansweredCount;
            
            if (unansweredCount > 0) {
                this.showModal('warning', 'Unanswered Questions', 
                    `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. These will be marked as incorrect. Are you sure you want to submit?`);
                
                // Wait for modal confirmation - for now just show warning and continue
                // User can still cancel by clicking outside or close button
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            if (!confirm('Final confirmation: Submit your quiz now? You cannot change answers after submission.')) {
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
                // For registered students, we use a different API endpoint
                // This requires the student to be verified via phone first
                if (!this.studentId) {
                    this.showModal('error', 'Student Not Verified', 'Please enter your phone number first to take this quiz.');
                    return;
                }
                
                const payload = {
                    student_id: this.studentId,
                    course_id: this.courseId,
                    quiz_package_id: this.quizPackageId,
                    score: this.results.score,
                    total_points: this.results.totalPoints,
                    time_taken: this.results.timeTaken,
                    answers: this.results.details.map(detail => ({
                        question_id: detail.questionId,
                        user_answer: detail.userAnswer,
                        is_correct: detail.isCorrect,
                        points_earned: detail.pointsEarned
                    }))
                };
                
                const response = await fetch('/api/student/quiz/submit-registered', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save quiz results');
                }
                
                const data = await response.json();
                console.log('Quiz results saved successfully:', data);
                
            } catch (error) {
                console.error('Error saving attempt:', error);
                this.showModal('error', 'Save Failed', 'Failed to save your quiz results: ' + error.message);
            }
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
