import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    username: string
    role: string
  }
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET || 'church_monitoring_secure_key_change_me_in_production'

    const decoded = jwt.verify(token, secret) as { id: string; username: string; role: string }

    // Fetch the operator to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. Operator not found.' })
    }

    // Attach user payload to request
    req.user = user
    next()
  } catch (error) {
    console.error('JWT Verification Error:', error)
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}
