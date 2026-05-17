import { Router } from 'express'
import {
  getSessionTypes,
  getSessions,
  createSession,
  getSessionChecklist,
  toggleAttendance,
  importAttendanceExcel,
} from '../controllers/attendanceController'
import { authMiddleware } from '../middlewares/authMiddleware'
import { restrictTo } from '../middlewares/roleMiddleware'

const router = Router()

// All attendance routes require operators to be authenticated
router.use(authMiddleware)

// Custom dropdown lookup routes (accessible by any logged-in operator)
router.get('/types', getSessionTypes)
router.get('/sessions', getSessions)
router.get('/checklist/:sessionId', getSessionChecklist)

// Modifying sessions or submitting manual checklists
router.post('/sessions', restrictTo('SUPER_ADMIN', 'ELDER', 'OFFICER'), createSession)
router.post('/toggle', restrictTo('SUPER_ADMIN', 'ELDER', 'OFFICER'), toggleAttendance)

// Spreadsheet bulk importer endpoint
router.post('/import', restrictTo('SUPER_ADMIN', 'ELDER', 'OFFICER'), importAttendanceExcel)

export default router
