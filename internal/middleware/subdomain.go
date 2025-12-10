package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// SubdomainRouter redirects requests based on subdomain
func SubdomainRouter() gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host

		// Remove port if exists (localhost:8080 -> localhost)
		if strings.Contains(host, ":") {
			host = strings.Split(host, ":")[0]
		}

		// Extract subdomain
		parts := strings.Split(host, ".")

		// Handle different subdomains (minimum 2 parts: subdomain.domain.com)
		if len(parts) >= 2 {
			subdomain := parts[0]

			switch subdomain {
			case "admin":
				// Admin subdomain - restrict to admin routes only
				path := c.Request.URL.Path
				if !strings.HasPrefix(path, "/admin") &&
					!strings.HasPrefix(path, "/api/admin") &&
					!strings.HasPrefix(path, "/api/auth/admin") &&
					!strings.HasPrefix(path, "/static") &&
					path != "/" {
					c.Redirect(302, "/admin/login")
					c.Abort()
					return
				}
				// Root path redirects to admin login
				if path == "/" {
					c.Redirect(302, "/admin/login")
					c.Abort()
					return
				}

			case "quiz":
				// Quiz subdomain - restrict to quiz routes only
				path := c.Request.URL.Path
				if !strings.HasPrefix(path, "/quiz") &&
					!strings.HasPrefix(path, "/api/quiz") &&
					!strings.HasPrefix(path, "/api/student") &&
					!strings.HasPrefix(path, "/api/auth/student") &&
					!strings.HasPrefix(path, "/static") &&
					!strings.HasPrefix(path, "/uploads") &&
					path != "/" {
					c.Redirect(302, "/quiz")
					c.Abort()
					return
				}
				// Root path shows quiz courses or redirects
				if path == "/" {
					c.Redirect(302, "/quiz")
					c.Abort()
					return
				}

			case "register":
				// Register subdomain - restrict to registration routes only
				path := c.Request.URL.Path
				if !strings.HasPrefix(path, "/register") &&
					!strings.HasPrefix(path, "/api/register") &&
					!strings.HasPrefix(path, "/api/student/courses") &&
					!strings.HasPrefix(path, "/static") &&
					path != "/" {
					// Get course list to redirect to first course registration
					c.Redirect(302, "/register/1")
					c.Abort()
					return
				}
				// Root path redirects to course list or first course
				if path == "/" {
					c.Redirect(302, "/register/1")
					c.Abort()
					return
				}

			case "www":
				// WWW subdomain - redirect to main domain or quiz
				c.Redirect(301, "https://quiz.mitsukijp.com")
				c.Abort()
				return

			case "localhost":
				// Allow localhost for development (no subdomain restrictions)
				// Do nothing, allow all routes
				break

			default:
				// Main domain or unknown subdomain
				// Redirect to quiz subdomain
				if len(parts) == 2 { // e.g., mitsukijp.com
					c.Redirect(301, "https://quiz.mitsukijp.com")
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}
