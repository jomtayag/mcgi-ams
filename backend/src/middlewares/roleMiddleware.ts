import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './authMiddleware'

export const restrictTo = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please authenticate first.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Your role (${req.user.role}) is unauthorized to perform this action.`,
      })
    }

    next()
  }
}
