package com.mitsui.quiz.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.mitsui.quiz.ui.screen.CourseListScreen
import com.mitsui.quiz.ui.screen.LoginScreen
import com.mitsui.quiz.ui.screen.QuizScreen
import com.mitsui.quiz.ui.screen.RegisterScreen
import com.mitsui.quiz.ui.viewmodel.AuthViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    
    val startDestination = if (isLoggedIn) Screen.CourseList.route else Screen.Login.route
    
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.CourseList.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }
        
        composable(Screen.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Screen.CourseList.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.CourseList.route) {
            CourseListScreen(
                onCourseClick = { course ->
                    // For now, we'll use the first quiz package
                    // In a real app, you might want to show a list of quiz packages
                    course.quizPackages?.firstOrNull()?.let { quizPackage ->
                        navController.navigate(
                            Screen.Quiz.createRoute(course.id, quizPackage.id)
                        )
                    }
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            route = Screen.Quiz.route,
            arguments = listOf(
                navArgument("courseId") { type = NavType.IntType },
                navArgument("quizPackageId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val courseId = backStackEntry.arguments?.getInt("courseId") ?: return@composable
            val quizPackageId = backStackEntry.arguments?.getInt("quizPackageId") ?: return@composable
            
            QuizScreen(
                courseId = courseId,
                quizPackageId = quizPackageId,
                onQuizComplete = {
                    navController.popBackStack()
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
