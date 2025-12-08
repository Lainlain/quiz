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
        selectedCourseForStudents: null,
        studentViewMode: 'courses', // 'courses' or 'all'
        
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
        students: [],
        studentCourses: [],
        courseStudents: [],
        courseEnrollments: [],
        allStudents: [],
        totalStudentCount: 0,
        
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
                case 'students':
                    this.viewTitle = 'Students';
                    await this.loadStudents();
                    break;
            }
        },
        
        // Load Data
        async loadStats() {
            const [courses, studentData] = await Promise.all([
                this.apiCall('/api/student/courses'),
                this.apiCall('/api/admin/students/courses')
            ]);
            
            this.stats.courses = courses?.length || 0;
            this.stats.students = studentData?.total_students || 0;
            this.totalStudentCount = studentData?.total_students || 0;
            this.stats.packages = 0;
            this.stats.questions = 0;
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
        
        async loadStudents() {
            // Load courses with student count for the main view
            const data = await this.apiCall('/api/admin/students/courses');
            
            if (data) {
                this.totalStudentCount = data.total_students || 0;
                this.studentCourses = data.courses || [];
                this.stats.students = data.total_students || 0;
            } else {
                this.totalStudentCount = 0;
                this.studentCourses = [];
                this.stats.students = 0;
            }
            
            // Reset selection
            this.selectedCourseForStudents = null;
            this.courseStudents = [];
            
            // Also load all students by default
            await this.loadAllStudents();
        },
        
        async selectCourseForStudents(course) {
            this.selectedCourseForStudents = course;
            // Load enrollments for this course
            const data = await this.apiCall(`/api/admin/enrollments/course/${course.id}`);
            this.courseEnrollments = data || [];
        },
        
        copyRegistrationLink(courseId) {
            const link = window.location.origin + '/register/' + courseId;
            const input = document.getElementById('reg-link-' + courseId);
            input.select();
            document.execCommand('copy');
            alert('Registration link copied to clipboard!');
        },
        
        async updateEnrollmentStatus(enrollmentId, status) {
            const confirmed = confirm(`Are you sure you want to ${status} this enrollment?`);
            if (!confirmed) return;
            
            const result = await this.apiCall(`/api/admin/enrollments/${enrollmentId}/status`, 'PUT', { status });
            
            if (result) {
                alert(`Enrollment ${status} successfully!`);
                // Reload enrollments
                if (this.selectedCourseForStudents) {
                    await this.selectCourseForStudents(this.selectedCourseForStudents);
                }
            }
        },
        
        viewEnrollmentDetails(enrollment) {
            const modal = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <p class="text-gray-900">${enrollment.name}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p class="text-gray-900">${enrollment.email}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p class="text-gray-900">${enrollment.phone_number}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <p class="text-gray-900 capitalize font-semibold">${enrollment.status}</p>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p class="text-gray-900">${enrollment.address}</p>
                    </div>
                    ${enrollment.facebook_url ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                        <a href="${enrollment.facebook_url}" target="_blank" class="text-blue-600 hover:underline">${enrollment.facebook_url}</a>
                    </div>
                    ` : ''}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                        <p class="text-gray-900">${this.formatDate(enrollment.created_at)}</p>
                    </div>
                </div>
            `;
            this.showModal('Enrollment Details', modal, false);
        },
        
        async loadAllStudents() {
            try {
                console.log('Starting loadAllStudents...');
                console.log('Token:', this.token);
                
                // Load all registered students
                const data = await this.apiCall('/api/admin/students');
                console.log('API response:', data);
                
                this.allStudents = data || [];
                console.log('allStudents array after assignment:', this.allStudents);
                console.log('allStudents length:', this.allStudents.length);
            } catch (error) {
                console.error('Error in loadAllStudents:', error);
                this.allStudents = [];
            }
        },
        
        viewStudentDetails(student) {
            // Show modal with student details
            const modal = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
                            <p class="text-gray-900">${student.id}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <p class="text-gray-900">${student.name}</p>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p class="text-gray-900">${student.email}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p class="text-xl font-bold text-green-600">${student.phone_number || 'Not provided'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                            <p class="text-xl font-bold text-blue-600">${student.course_name || 'No Course'}</p>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registered Date</label>
                        <p class="text-gray-900">${this.formatDate(student.created_at)}</p>
                    </div>
                </div>
            `;
            this.showModal('Student Details', modal, false);
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
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Maximum Retake Count per Student</label>
                            <input type="number" id="packageMaxRetakeCount" value="${pkg?.max_retake_count || 1}" 
                                   min="1" max="10" placeholder="Enter max retakes (1-10)"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                            <p class="text-xs text-gray-500 mt-1">How many times a student can retake quizzes in this package</p>
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
                                <label class="block text-sm font-medium text-gray-700 mb-1">Question Image <span class="text-gray-500 text-xs">(Optional)</span></label>
                                <input type="hidden" id="questionImageUrl" value="${question?.image_url || ''}">
                                
                                <!-- Image Preview -->
                                <div id="imagePreviewContainer" class="mb-2" style="display: ${question?.image_url ? 'block' : 'none'}">
                                    <img id="imagePreview" src="${question?.image_url || ''}" class="max-w-xs max-h-48 rounded-lg border">
                                    <button type="button" onclick="removeQuestionImage()" class="mt-2 text-sm text-red-600 hover:text-red-800">Remove Image</button>
                                </div>
                                
                                <!-- Upload Button -->
                                <div id="uploadButtonContainer" style="display: ${question?.image_url ? 'none' : 'block'}">
                                    <label for="questionImageFile" class="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        Choose Image
                                    </label>
                                    <input type="file" id="questionImageFile" accept="image/*" class="hidden" onchange="uploadQuestionImage(this)">
                                    <p class="text-xs text-gray-500 mt-1">Upload JPG, PNG, GIF, or WebP (Max 5MB)</p>
                                </div>
                                
                                <!-- Upload Progress -->
                                <div id="uploadProgress" class="mt-2" style="display: none">
                                    <div class="flex items-center gap-2">
                                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                                            <div id="uploadProgressBar" class="bg-blue-600 h-2 rounded-full transition-all" style="width: 0%"></div>
                                        </div>
                                        <span id="uploadProgressText" class="text-sm text-gray-600">0%</span>
                                    </div>
                                </div>
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
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Points <span class="text-red-500">*</span></label>
                                    <input type="number" id="questionPoints" value="${question?.points || ''}" 
                                           placeholder="Enter points (e.g. 5, 10, 15)" min="1" max="100"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                                    <p class="text-xs text-gray-500 mt-1">Set custom points for this question</p>
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
        
        // Student Management
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        },
        
        async viewStudentCourseDetails(student) {
            // Show student course details modal
            const modal = `
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-lg mb-3">${student.name}</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="font-medium">Email:</span> ${student.email}</p>
                            <p><span class="font-medium">Course:</span> ${this.selectedCourseForStudents.title}</p>
                            <p><span class="font-medium">Attempts in Course:</span> ${student.attempts_in_course}</p>
                            <p><span class="font-medium">Best Score:</span> ${student.best_score} pts (${student.best_percentage.toFixed(1)}%)</p>
                            <p><span class="font-medium">Last Attempt:</span> ${this.formatDate(student.last_attempt_date)}</p>
                            <p><span class="font-medium">Status:</span> <span class="capitalize">${student.status}</span></p>
                            <p><span class="font-medium">Registered:</span> ${this.formatDate(student.created_at)}</p>
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button onclick="closeCustomModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Close
                        </button>
                    </div>
                </div>
            `;
            showCustomModal('Student Course Details', modal);
        },
        
        async deleteStudent(studentId) {
            if (!confirm('Are you sure you want to delete this student? This will also delete all their attempts and data.')) {
                return;
            }
            
            const response = await this.apiCall(`/api/admin/students/${studentId}`, 'DELETE');
            
            if (response && response.message) {
                alert('Student deleted successfully');
                await this.loadStudents();
                await this.loadStats();
            } else {
                alert('Failed to delete student');
            }
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
        max_retake_count: parseInt(document.getElementById('packageMaxRetakeCount').value),
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
        image_url: document.getElementById('questionImageUrl').value,
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

// Image upload function
async function uploadQuestionImage(input) {
    const file = input.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        input.value = '';
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, GIF, and WebP images are allowed');
        input.value = '';
        return;
    }

    // Show progress
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadButtonContainer').style.display = 'none';

    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');

    try {
        const xhr = new XMLHttpRequest();

        // Progress handler
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                document.getElementById('uploadProgressBar').style.width = percentComplete + '%';
                document.getElementById('uploadProgressText').textContent = percentComplete + '%';
            }
        });

        // Complete handler
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                
                // Set image URL
                document.getElementById('questionImageUrl').value = response.image_url;
                
                // Show preview
                document.getElementById('imagePreview').src = response.image_url;
                document.getElementById('imagePreviewContainer').style.display = 'block';
                
                // Hide progress
                document.getElementById('uploadProgress').style.display = 'none';
                
                // Show success message
                setTimeout(() => {
                    alert('✅ Image uploaded successfully!');
                }, 100);
            } else {
                alert('Failed to upload image. Please try again.');
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('uploadButtonContainer').style.display = 'block';
            }
            input.value = ''; // Reset input
        });

        // Error handler
        xhr.addEventListener('error', () => {
            alert('Failed to upload image. Please try again.');
            document.getElementById('uploadProgress').style.display = 'none';
            document.getElementById('uploadButtonContainer').style.display = 'block';
            input.value = '';
        });

        xhr.open('POST', '/api/admin/upload/image');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);

    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image. Please try again.');
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadButtonContainer').style.display = 'block';
        input.value = '';
    }
}

// Remove image function
function removeQuestionImage() {
    if (confirm('Are you sure you want to remove this image?')) {
        document.getElementById('questionImageUrl').value = '';
        document.getElementById('imagePreview').src = '';
        document.getElementById('imagePreviewContainer').style.display = 'none';
        document.getElementById('uploadButtonContainer').style.display = 'block';
    }
}
