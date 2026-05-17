import { Router } from 'express'
import { login, register, getMe } from '../controllers/authController'
import { authMiddleware } from '../middlewares/authMiddleware'
import { restrictTo } from '../middlewares/roleMiddleware'

const router = Router()

// Public route
router.post('/login', login)

// Authenticated route
router.get('/me', authMiddleware, getMe)

// Admin-only route
router.post('/register', authMiddleware, restrictTo('SUPER_ADMIN', 'ELDER'), register)

export default router
