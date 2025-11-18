package com.mitsui.quiz.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Blue,
    onPrimary = White,
    primaryContainer = Gray100,
    onPrimaryContainer = Gray900,
    secondary = BlueDark,
    onSecondary = White,
    secondaryContainer = Gray200,
    onSecondaryContainer = Gray900,
    tertiary = Orange,
    onTertiary = White,
    tertiaryContainer = Gray100,
    onTertiaryContainer = Gray900,
    error = Red,
    onError = White,
    errorContainer = Gray100,
    onErrorContainer = Red,
    background = White,
    onBackground = Gray900,
    surface = White,
    onSurface = Gray900,
    surfaceVariant = Gray100,
    onSurfaceVariant = Gray700,
    outline = Gray400,
    outlineVariant = Gray200,
    scrim = Black.copy(alpha = 0.32f),
    inverseSurface = Gray900,
    inverseOnSurface = White,
    inversePrimary = Blue,
    surfaceTint = Blue
)

@Composable
fun MitsukiQuizTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme // Always use light theme (white theme)
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            // Set status bar and navigation bar to white
            window.statusBarColor = White.toArgb()
            window.navigationBarColor = White.toArgb()
            
            // Set status bar icons to dark (so they're visible on white background)
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = true
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
