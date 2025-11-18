package com.mitsui.quiz.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object CourseList : Screen("course_list")
    object Quiz : Screen("quiz/{courseId}/{quizPackageId}") {
        fun createRoute(courseId: Int, quizPackageId: Int) = "quiz/$courseId/$quizPackageId"
    }
}
