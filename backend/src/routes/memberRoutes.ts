import { Router } from 'express'
import { getAllMembers, getMemberById, createMember, updateMember, deleteMember } from '../controllers/memberController'
import { authMiddleware } from '../middlewares/authMiddleware'
import { restrictTo } from '../middlewares/roleMiddleware'

const router = Router()

// All member routes require operators to be authenticated
router.use(authMiddleware)

router.get('/', getAllMembers)
router.get('/:id', getMemberById)

// CRUD modifications restricted to SUPER_ADMIN, ELDER, and OFFICERS
router.post('/', restrictTo('SUPER_ADMIN', 'ELDER', 'OFFICER'), createMember)
router.put('/:id', restrictTo('SUPER_ADMIN', 'ELDER', 'OFFICER'), updateMember)

// Destructive soft deletions restricted to SUPER_ADMIN and ELDER only
router.delete('/:id', restrictTo('SUPER_ADMIN', 'ELDER'), deleteMember)

export default router
