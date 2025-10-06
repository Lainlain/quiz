// Dashboard Alpine.js Component
function dashboard() {
    return {
        user: {},
        token: '',
        currentView: 'overview',
        viewTitle: 'Overview',
        
        // Selection for drilldown
        selectedCourseId: null,
        selectedPackageId: null,
        
        // Data
        stats: {
            courses: 0,
            packages: 0,
            questions: 0,
            students: 0
        },
        courses: [],
        packages: [],
        questions: [],
        
        // Initialize
        async init() {
            // Check authentication
            this.token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            
            if (!this.token || !userStr) {
                window.location.href = '/admin/login';
                return;
            }
            
            this.user = JSON.parse(userStr);
            
            // Load initial data
            await this.loadStats();
            await this.loadCourses();
        },
        
        // API Helper
        async apiCall(endpoint, method = 'GET', body = null) {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(endpoint, options);
            
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = '/admin/login';
                return null;
            }
            
            return await response.json();
        },
        
        // View Management
        async switchView(view) {
            this.currentView = view;
            
            switch(view) {
                case 'overview':
                    this.viewTitle = 'Overview';
                    await this.loadStats();
                    break;
                case 'courses':
                    this.viewTitle = 'Courses';
                    await this.loadCourses();
                    break;
                case 'packages':
                    this.viewTitle = 'Quiz Packages';
                    await this.loadPackages();
                    break;
                case 'questions':
                    this.viewTitle = 'Questions';
                    await this.loadQuestions();
                    break;
            }
        },
        
        // Load Data
        async loadStats() {
            const [courses, packages, questions] = await Promise.all([
                this.apiCall('/api/student/courses'),
                Promise.resolve([]), // We'll count from courses
                Promise.resolve([])
            ]);
            
            this.stats.courses = courses?.length || 0;
            this.stats.packages = 0;
            this.stats.questions = 0;
            this.stats.students = 0; // TODO: Add students endpoint
        },
        
        async loadCourses() {
            const data = await this.apiCall('/api/student/courses');
            this.courses = data || [];
            this.stats.courses = this.courses.length;
        },
        
        async loadPackages() {
            // Load all courses first if not loaded
            if (this.courses.length === 0) {
                await this.loadCourses();
            }
            
            // Extract packages from courses
            this.packages = [];
            this.courses.forEach(course => {
                if (course.quiz_packages) {
                    course.quiz_packages.forEach(pkg => {
                        this.packages.push({...pkg, course_id: course.id});
                    });
                }
            });
            this.stats.packages = this.packages.length;
        },
        
        async loadQuestions() {
            // For now, we'll need to load from packages
            if (this.packages.length === 0) {
                await this.loadPackages();
            }
            
            this.questions = [];
            for (const pkg of this.packages) {
                const data = await this.apiCall(`/api/student/questions/package/${pkg.id}`);
                if (data) {
                    data.forEach(q => {
                        this.questions.push({...q, quiz_package_id: pkg.id});
                    });
                }
            }
            this.stats.questions = this.questions.length;
        },
        
        // CRUD Operations - Courses
        openAddModal() {
            if (this.currentView === 'courses') {
                this.showCourseModal();
            } else if (this.currentView === 'packages') {
                this.showPackageModal();
            } else if (this.currentView === 'questions') {
                this.showQuestionModal();
            }
        },
        
        showCourseModal(course = null) {
            const isEdit = !!course;
            const modal = `
                <form onsubmit="event.preventDefault(); saveCourse(${isEdit});">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" id="courseTitle" value="${course?.title || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="courseDescription" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${course?.description || ''}</textarea>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Student Limit</label>
                                <input type="number" id="courseStudentLimit" value="${course?.student_limit || 50}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Retry Count</label>
                                <input type="number" id="courseRetryCount" value="${course?.retry_count || 3}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Exam Time (min)</label>
                                <input type="number" id="courseExamTime" value="${course?.exam_time || 60}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="courseIsActive" ${course?.is_active !== false ? 'checked' : ''} 
                                   class="w-4 h-4 text-blue-600 rounded">
                            <label for="courseIsActive" class="ml-2 text-sm text-gray-700">Active</label>
                        </div>
                    </div>
                    <div class="mt-6 flex gap-3">
                        <button type="submit" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            ${isEdit ? 'Update' : 'Create'} Course
                        </button>
                        <button type="button" onclick="closeCustomModal()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                </form>
            `;
            
            showCustomModal(isEdit ? 'Edit Course' : 'Add Course', modal);
            
            if (isEdit) {
                window.currentEditId = course.id;
            }
        },
        
        async editCourse(course) {
            this.showCourseModal(course);
        },
        
        async deleteCourse(id) {
            if (!confirm('Are you sure you want to delete this course?')) return;
            
            const response = await fetch(`/api/admin/courses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                await this.loadCourses();
            }
        },
        
        // Package operations
        showPackageModal(pkg = null) {
            const isEdit = !!pkg;
            // Auto-select parent course if viewing from a specific course
            const preselectedCourseId = pkg?.course_id || this.selectedCourseId;
            const coursesOptions = this.courses.map(c => 
                `<option value="${c.id}" ${preselectedCourseId === c.id ? 'selected' : ''}>${c.title}</option>`
            ).join('');
            
            const modal = `
                <form onsubmit="event.preventDefault(); savePackage(${isEdit});">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select id="packageCourseId" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                                <option value="">Select Course</option>
                                ${coursesOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" id="packageTitle" value="${pkg?.title || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="packageDescription" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg">${pkg?.description || ''}</textarea>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="packageIsActive" ${pkg?.is_active !== false ? 'checked' : ''} 
                                   class="w-4 h-4 text-blue-600 rounded">
                            <label for="packageIsActive" class="ml-2 text-sm text-gray-700">Active</label>
                        </div>
                    </div>
                    <div class="mt-6 flex gap-3">
                        <button type="submit" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            ${isEdit ? 'Update' : 'Create'} Package
                        </button>
                        <button type="button" onclick="closeCustomModal()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                </form>
            `;
            
            showCustomModal(isEdit ? 'Edit Quiz Package' : 'Add Quiz Package', modal);
            
            if (isEdit) {
                window.currentEditId = pkg.id;
            }
        },
        
        async editPackage(pkg) {
            this.showPackageModal(pkg);
        },
        
        async deletePackage(id) {
            if (!confirm('Are you sure you want to delete this quiz package?')) return;
            
            const response = await fetch(`/api/admin/quiz-packages/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                await this.loadPackages();
            }
        },
        
        // Question operations
        showQuestionModal(question = null) {
            const isEdit = !!question;
            // Auto-select parent package if viewing from a specific package
            const preselectedPackageId = question?.quiz_package_id || this.selectedPackageId;
            const packagesOptions = this.packages.map(p => 
                `<option value="${p.id}" ${preselectedPackageId === p.id ? 'selected' : ''}>${p.title}</option>`
            ).join('');
            let choices = ["", "", "", ""];
            if (question && question.options) {
                try {
                    const arr = JSON.parse(question.options);
                    for (let i = 0; i < arr.length && i < 4; i++) choices[i] = arr[i];
                } catch {}
            }
            const modal = `
                <form onsubmit="event.preventDefault(); saveQuestion(${isEdit});">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Quiz Package</label>
                            <select id="questionPackageId" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                                <option value="">Select Package</option>
                                ${packagesOptions}
                            </select>
                        </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                <textarea id="questionText" rows="3"
                                          class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>${question?.question_text || ''}</textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select id="questionType" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                                    <option value="multiple_choice" ${question?.question_type === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
                                    <option value="true_false" ${question?.question_type === 'true_false' ? 'selected' : ''}>True/False</option>
                                    <option value="short_answer" ${question?.question_type === 'short_answer' ? 'selected' : ''}>Short Answer</option>
                                </select>
                            </div>
                            <div id="choicesBox">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Choices</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="text" id="choiceA" placeholder="Choice A" value="${choices[0]}" class="px-3 py-2 border border-gray-300 rounded-lg">
                                    <input type="text" id="choiceB" placeholder="Choice B" value="${choices[1]}" class="px-3 py-2 border border-gray-300 rounded-lg">
                                    <input type="text" id="choiceC" placeholder="Choice C" value="${choices[2]}" class="px-3 py-2 border border-gray-300 rounded-lg">
                                    <input type="text" id="choiceD" placeholder="Choice D" value="${choices[3]}" class="px-3 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                    <input type="text" id="questionCorrectAnswer" value="${question?.correct_answer || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                                    <input type="number" id="questionPoints" value="${question?.points || 10}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                                </div>
                            </div>
                        </div>
                        <div class="mt-6 flex gap-3">
                            <button type="submit" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                ${isEdit ? 'Update' : 'Create'} Question
                            </button>
                            <button type="button" onclick="closeCustomModal()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                        </div>
                    </form>
                `;
                showCustomModal(isEdit ? 'Edit Question' : 'Add Question', modal);
                if (isEdit) {
                    window.currentEditId = question.id;
                }
        },
        
        async editQuestion(question) {
            this.showQuestionModal(question);
        },
        
        async deleteQuestion(id) {
            if (!confirm('Are you sure you want to delete this question?')) return;
            
            const response = await fetch(`/api/admin/questions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                await this.loadQuestions();
            }
        },
        
        // Helper functions
        getCourseName(courseId) {
            const course = this.courses.find(c => c.id === courseId);
            return course ? course.title : 'Unknown';
        },
        
        getPackageName(packageId) {
            const pkg = this.packages.find(p => p.id === packageId);
            return pkg ? pkg.title : 'Unknown';
        },
        
        getCoursePackageCount(courseId) {
            return this.packages.filter(p => p.course_id === courseId).length;
        },
        
        getCourseQuestionCount(courseId) {
            const coursePackages = this.packages.filter(p => p.course_id === courseId);
            const packageIds = coursePackages.map(p => p.id);
            return this.questions.filter(q => packageIds.includes(q.quiz_package_id)).length;
        },
        
        getPackageQuestionCount(packageId) {
            return this.questions.filter(q => q.quiz_package_id === packageId).length;
        },
        
        // Copy quiz link
        copyQuizLink(packageId) {
            const quizUrl = `${window.location.origin}/quiz?package=${packageId}`;
            
            // Try modern clipboard API first (requires HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(quizUrl).then(() => {
                    alert('✅ Quiz link copied to clipboard!\n\n' + quizUrl);
                }).catch(() => {
                    this.fallbackCopy(quizUrl);
                });
            } else {
                // Fallback for HTTP or older browsers
                this.fallbackCopy(quizUrl);
            }
        },
        
        fallbackCopy(text) {
            // Create temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            
            // Select and copy
            textarea.focus();
            textarea.select();
            
            try {
                document.execCommand('copy');
                alert('✅ Quiz link copied to clipboard!\n\n' + text);
            } catch (err) {
                // If all else fails, show prompt to manually copy
                prompt('Copy this quiz link:', text);
            }
            
            document.body.removeChild(textarea);
        },
        
        // Show package statistics
        async showPackageStats(pkg) {
            // Fetch statistics data
            const stats = await this.apiCall(`/api/admin/quiz-packages/${pkg.id}/stats`);
            
            if (!stats) {
                alert('Failed to load statistics');
                return;
            }
            
            const modal = `
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="text-center pb-4 border-b">
                        <h3 class="text-xl font-bold text-gray-900">${pkg.title}</h3>
                        <p class="text-sm text-gray-500 mt-1">${this.getCourseName(pkg.course_id)}</p>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 rounded-lg p-4 text-center">
                            <div class="text-3xl font-bold text-blue-600">${stats.total_attempts || 0}</div>
                            <div class="text-xs text-gray-600 mt-1">Total Attempts</div>
                        </div>
                        <div class="bg-green-50 rounded-lg p-4 text-center">
                            <div class="text-3xl font-bold text-green-600">${stats.average_score || 0}%</div>
                            <div class="text-xs text-gray-600 mt-1">Average Score</div>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-4 text-center">
                            <div class="text-3xl font-bold text-purple-600">${stats.pass_rate || 0}%</div>
                            <div class="text-xs text-gray-600 mt-1">Pass Rate (≥60%)</div>
                        </div>
                        <div class="bg-orange-50 rounded-lg p-4 text-center">
                            <div class="text-3xl font-bold text-orange-600">${stats.completion_rate || 0}%</div>
                            <div class="text-xs text-gray-600 mt-1">Completion Rate</div>
                        </div>
                    </div>
                    
                    <!-- Score Distribution -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-900 mb-3">Score Distribution</h4>
                        <div class="space-y-2">
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-600 w-24">90-100%:</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-6">
                                    <div class="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2" style="width: ${stats.score_distribution?.excellent || 0}%">
                                        <span class="text-xs text-white font-semibold">${stats.score_distribution?.excellent || 0}%</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-600 w-24">80-89%:</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-6">
                                    <div class="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2" style="width: ${stats.score_distribution?.good || 0}%">
                                        <span class="text-xs text-white font-semibold">${stats.score_distribution?.good || 0}%</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-600 w-24">60-79%:</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-6">
                                    <div class="bg-yellow-500 h-6 rounded-full flex items-center justify-end pr-2" style="width: ${stats.score_distribution?.average || 0}%">
                                        <span class="text-xs text-white font-semibold">${stats.score_distribution?.average || 0}%</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-600 w-24">Below 60%:</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-6">
                                    <div class="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2" style="width: ${stats.score_distribution?.poor || 0}%">
                                        <span class="text-xs text-white font-semibold">${stats.score_distribution?.poor || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Attempts -->
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-3">Recent Attempts</h4>
                        <div class="max-h-64 overflow-y-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">Score</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">Total</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">Percentage</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${stats.recent_attempts && stats.recent_attempts.length > 0 ? 
                                        stats.recent_attempts.map(attempt => {
                                            // Determine color based on percentage
                                            let scoreColor = 'text-red-600 bg-red-50';      // Fail (<60%)
                                            let percentageText = 'Fail';
                                            if (attempt.percentage >= 80) {
                                                scoreColor = 'text-green-600 bg-green-50';  // Excellent (≥80%)
                                                percentageText = 'Excellent';
                                            } else if (attempt.percentage >= 60) {
                                                scoreColor = 'text-blue-600 bg-blue-50';    // Normal/Pass (60-79%)
                                                percentageText = 'Pass';
                                            }
                                            
                                            return `
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-4 py-2 text-sm text-gray-900 font-medium">${attempt.student_name || 'Anonymous'}</td>
                                                <td class="px-4 py-2 text-center">
                                                    <span class="text-lg font-bold ${scoreColor.split(' ')[0]}">${attempt.score}</span>
                                                </td>
                                                <td class="px-4 py-2 text-center">
                                                    <span class="text-sm text-gray-500">/ ${attempt.total_score}</span>
                                                </td>
                                                <td class="px-4 py-2 text-center">
                                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${scoreColor}">
                                                        ${attempt.percentage}%
                                                    </span>
                                                </td>
                                                <td class="px-4 py-2 text-sm text-gray-500">${attempt.completed_at || 'N/A'}</td>
                                                <td class="px-4 py-2 text-center">
                                                    <span class="px-2 py-1 rounded-full text-xs font-medium ${attempt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                                        ${attempt.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        `}).join('') 
                                        : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No attempts yet</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t">
                        <button onclick="closeCustomModal()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                            Close
                        </button>
                        <button onclick="window.print()" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            📄 Print Report
                        </button>
                    </div>
                </div>
            `;
            
            showCustomModal('📊 Quiz Package Statistics', modal);
        },
        
        // Show course statistics (students who attempted)
        async showCourseStats(course) {
            // Fetch statistics data
            const stats = await this.apiCall(`/api/admin/courses/${course.id}/stats`);
            
            if (!stats) {
                alert('Failed to load course statistics');
                return;
            }
            
            const modal = `
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="text-center pb-4 border-b">
                        <h3 class="text-xl font-bold text-gray-900">${course.title}</h3>
                        <p class="text-sm text-gray-500 mt-1">Student Attempts Overview</p>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-blue-50 rounded-lg p-4 text-center">
                            <div class="text-3xl font-bold text-blue-600">${stats.total_attempts || 0}</div>
                            <div class="text-xs text-gray-600 mt-1">Total Attempts</div>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-4 text-center">
                            <div class="text-3xl font-bold text-purple-600">${stats.unique_students || 0}</div>
                            <div class="text-xs text-gray-600 mt-1">Unique Students</div>
                        </div>
                    </div>
                    
                    <!-- Student Attempts Table -->
                    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div class="max-h-96 overflow-y-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                        <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attempts</th>
                                        <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Best Score</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Attempt</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${stats.student_attempts && stats.student_attempts.length > 0 
                                        ? stats.student_attempts.map(student => {
                                            const percentage = Math.round((student.best_score / student.total_points) * 100);
                                            const scoreColor = percentage >= 80 ? 'bg-green-100 text-green-800' : 
                                                             percentage >= 60 ? 'bg-blue-100 text-blue-800' : 
                                                             'bg-red-100 text-red-800';
                                            return `
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-4 py-3 text-sm text-gray-900">${student.student_name}</td>
                                                <td class="px-4 py-3 text-center">
                                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        ${student.attempt_count} ${student.attempt_count >= 3 ? '(Max)' : ''}
                                                    </span>
                                                </td>
                                                <td class="px-4 py-3 text-center">
                                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${scoreColor}">
                                                        ${student.best_score}/${student.total_points} (${percentage}%)
                                                    </span>
                                                </td>
                                                <td class="px-4 py-3 text-sm text-gray-500">${new Date(student.last_attempt).toLocaleString()}</td>
                                            </tr>
                                        `}).join('') 
                                        : '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No attempts yet</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t">
                        <button onclick="closeCustomModal()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                            Close
                        </button>
                        <button onclick="window.print()" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            📄 Print Report
                        </button>
                    </div>
                </div>
            `;
            
            showCustomModal('👥 Course Student Statistics', modal);
        },
        
        // Filter methods for drilldown
        filteredPackages() {
            if (!this.selectedCourseId) return this.packages;
            return this.packages.filter(p => p.course_id === this.selectedCourseId);
        },
        
        filteredQuestions() {
            if (!this.selectedPackageId) return this.questions;
            return this.questions.filter(q => q.quiz_package_id === this.selectedPackageId);
        },
        
        // Selection methods
        selectCourse(course) {
            this.selectedCourseId = course.id;
            this.currentView = 'packages';
            this.viewTitle = 'Quiz Packages';
            this.selectedPackageId = null;
            // Load packages if not already loaded
            if (this.packages.length === 0) {
                this.loadPackages();
            }
        },
        
        async selectPackage(pkg) {
            this.selectedPackageId = pkg.id;
            this.currentView = 'questions';
            this.viewTitle = 'Questions';
            // Load questions when package is selected
            await this.loadQuestions();
        },
        
        // Logout
        logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                window.location.href = '/admin/login';
            }
        }
    };
}

// Modal helpers
function showCustomModal(title, content) {
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                <button onclick="closeCustomModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="px-6 py-4">
                ${content}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeCustomModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}

// Save functions (global scope for form submissions)
async function saveCourse(isEdit) {
    const token = localStorage.getItem('token');
    const data = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        student_limit: parseInt(document.getElementById('courseStudentLimit').value),
        retry_count: parseInt(document.getElementById('courseRetryCount').value),
        exam_time: parseInt(document.getElementById('courseExamTime').value),
        is_active: document.getElementById('courseIsActive').checked
    };
    
    const url = isEdit ? `/api/admin/courses/${window.currentEditId}` : '/api/admin/courses';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    
    if (response.ok) {
        closeCustomModal();
        // Refresh data without reloading page
        const dashboardComponent = Alpine.$data(document.querySelector('[x-data="dashboard()"]'));
        await dashboardComponent.loadCourses();
        await dashboardComponent.loadStats();
    } else {
        alert('Failed to save course. Please try again.');
    }
}

async function savePackage(isEdit) {
    const token = localStorage.getItem('token');
    const data = {
        course_id: parseInt(document.getElementById('packageCourseId').value),
        title: document.getElementById('packageTitle').value,
        description: document.getElementById('packageDescription').value,
        is_active: document.getElementById('packageIsActive').checked
    };
    
    const url = isEdit ? `/api/admin/quiz-packages/${window.currentEditId}` : '/api/admin/quiz-packages';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    
    if (response.ok) {
        closeCustomModal();
        // Refresh data without reloading page
        const dashboardComponent = Alpine.$data(document.querySelector('[x-data="dashboard()"]'));
        await dashboardComponent.loadPackages();
        await dashboardComponent.loadStats();
    } else {
        alert('Failed to save package. Please try again.');
    }
}

async function saveQuestion(isEdit) {
    const token = localStorage.getItem('token');
    let optionsArr = [];
    if (document.getElementById('questionType').value === 'multiple_choice') {
        optionsArr = [
            document.getElementById('choiceA').value,
            document.getElementById('choiceB').value,
            document.getElementById('choiceC').value,
            document.getElementById('choiceD').value
        ];
    }
    const data = {
        quiz_package_id: parseInt(document.getElementById('questionPackageId').value),
        question_text: document.getElementById('questionText').value,
        question_type: document.getElementById('questionType').value,
        options: JSON.stringify(optionsArr),
        correct_answer: document.getElementById('questionCorrectAnswer').value,
        points: parseInt(document.getElementById('questionPoints').value),
        is_active: true
    };
    
    const url = isEdit ? `/api/admin/questions/${window.currentEditId}` : '/api/admin/questions';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    
    if (response.ok) {
        closeCustomModal();
        // Refresh data without reloading page
        const dashboardComponent = Alpine.$data(document.querySelector('[x-data="dashboard()"]'));
        await dashboardComponent.loadQuestions();
        await dashboardComponent.loadStats();
    } else {
        alert('Failed to save question. Please try again.');
    }
}
