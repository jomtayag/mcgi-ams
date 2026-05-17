import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

// Import Routes
import authRoutes from './routes/authRoutes'
import memberRoutes from './routes/memberRoutes'
import attendanceRoutes from './routes/attendanceRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Enable security headers and robust CORS policy
app.use(helmet())
app.use(cors({ origin: '*' }))

// Increase body parser limits to support base64 Excel spreadsheet uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Mount API Routes
app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/attendance', attendanceRoutes)

// Main Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Church Membership & Attendance Core API Engine',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: 'connected (Laragon MySQL live)',
  })
})

// Root fallback route
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Requested API resource not found.',
  })
})

// Centralized Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Exception:', err)
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected exception occurred inside the core server.',
  })
})

// Server listener bootstrapping
app.listen(PORT, () => {
  console.log(`\n======================================================`)
  console.log(`⛪ CHURCH SYSTEM CORE API RUNNING ON PORT ${PORT} ⛪`)
  console.log(`======================================================`)
  console.log(`👉 Live Server URL: http://localhost:${PORT}`)
  console.log(`👉 Health Check:   http://localhost:${PORT}/api/health`)
  console.log(`======================================================\n`)
})
