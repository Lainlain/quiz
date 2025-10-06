// Device Fingerprinting Function
async function generateDeviceFingerprint() {
    const components = [];
    
    // Screen information
    components.push(screen.width);
    components.push(screen.height);
    components.push(screen.colorDepth);
    
    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Language
    components.push(navigator.language);
    
    // Platform
    components.push(navigator.platform);
    
    // Hardware concurrency
    components.push(navigator.hardwareConcurrency || 'unknown');
    
    // User agent
    components.push(navigator.userAgent);
    
    // Canvas fingerprint
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Mitsui JPY Quiz', 2, 15);
        components.push(canvas.toDataURL());
    } catch (e) {
        components.push('canvas-error');
    }
    
    // WebGL fingerprint
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
                components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }
        }
    } catch (e) {
        components.push('webgl-error');
    }
    
    // Generate hash from components
    const fingerprint = components.join('|');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}

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
        deviceId: '',
        
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
            // Generate device fingerprint
            this.deviceId = await generateDeviceFingerprint();
            console.log('Device ID:', this.deviceId);
            
            // Get quiz package ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.quizPackageId = parseInt(urlParams.get('package'));
            
            if (!this.quizPackageId) {
                alert('Invalid quiz link');
                return;
            }
            
            await this.loadQuizData();
            
            // Check if device already took this quiz
            await this.checkDeviceEligibility();
        },
        
        // Check if device is eligible to take this quiz
        async checkDeviceEligibility() {
            try {
                const response = await fetch(`/api/quiz/check-device?quiz_package_id=${this.quizPackageId}&device_id=${this.deviceId}`);
                const data = await response.json();
                
                if (data.already_taken) {
                    alert('You have already taken this quiz from this device. Each student can only take the quiz once per device.');
                    this.currentScreen = 'blocked';
                } else if (data.student_name) {
                    // Auto-fill student name from previous quiz on this device
                    this.studentName = data.student_name;
                    console.log('Auto-filled student name:', this.studentName);
                }
            } catch (error) {
                console.error('Error checking device eligibility:', error);
                // Continue anyway if check fails
            }
        },
        
        // Load quiz data
        async loadQuizData() {
            try {
                // Load quiz package details
                const pkgResponse = await fetch(`/api/student/quiz-packages/${this.quizPackageId}`);
                const pkgData = await pkgResponse.json();
                
                this.quizPackageName = pkgData.title;
                console.log('Quiz Package:', pkgData);
                
                // Load course details
                const courseResponse = await fetch(`/api/student/courses/${pkgData.course_id}`);
                const courseData = await courseResponse.json();
                
                this.courseId = courseData.id;
                this.courseName = courseData.title;
                this.examTime = courseData.exam_time;
                
                console.log('Course Data:', courseData);
                console.log('Exam Time:', this.examTime, 'minutes');
                
                // Load questions
                const questionsResponse = await fetch(`/api/student/questions/package/${this.quizPackageId}`);
                this.questions = await questionsResponse.json();
                
                console.log('Questions loaded:', this.questions.length);
                
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
            
            // Validate exam time
            if (!this.examTime || this.examTime <= 0) {
                alert('Error: Invalid exam time. Please contact administrator.');
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
                const payload = {
                    student_name: this.studentName,
                    course_id: this.courseId,
                    quiz_package_id: this.quizPackageId,
                    device_id: this.deviceId,
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
                
                console.log('Submitting quiz with payload:', payload);
                
                const response = await fetch('/api/quiz/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Attempt saved successfully:', data);
                } else if (response.status === 403) {
                    // Retry limit reached
                    const error = await response.json();
                    alert(error.message || 'Maximum retry limit reached. You have already taken this quiz 3 times.');
                } else {
                    const error = await response.json();
                    console.error('Failed to save attempt:', error);
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
