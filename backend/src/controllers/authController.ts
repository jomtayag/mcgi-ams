import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { z } from 'zod'

const prisma = new PrismaClient()

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'ELDER', 'OFFICER', 'MEMBER']).default('OFFICER'),
})

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { username: validated.username },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const isMatch = await bcrypt.compare(validated.password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const secret = process.env.JWT_SECRET || 'church_monitoring_secure_key_change_me_in_production'
    const expires = process.env.JWT_EXPIRES_IN || '7d'

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: expires as any }
    )

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Login error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body)

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: validated.username },
    })

    if (existing) {
      return res.status(400).json({ error: 'Username is already taken.' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(validated.password, salt)

    const newUser = await prisma.user.create({
      data: {
        username: validated.username,
        password: hashedPassword,
        role: validated.role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    return res.status(201).json({
      message: 'Operator registered successfully',
      user: newUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    return res.status(200).json({ user: req.user })
  } catch (error) {
    console.error('GetMe error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}
