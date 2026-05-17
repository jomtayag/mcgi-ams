import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import * as xlsx from 'xlsx'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const createSessionSchema = z.object({
  date: z.string(), // ISO String
  name: z.string().min(2), // e.g. 'WS - April 11, 2026'
  sessionTypeId: z.string(),
})

const toggleSchema = z.object({
  memberId: z.string(),
  sessionId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'TRANSFERRED']),
  method: z.enum(['MANUAL', 'BIOMETRIC', 'BARCODE']).default('MANUAL'),
})

const excelImportSchema = z.object({
  fileBase64: z.string(), // Base64 encoded string of Excel file
  sessionTypeId: z.string(), // Default session type mapping if column matches are generic
})

// 1. Get all session types
export const getSessionTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const types = await prisma.sessionType.findMany({
      orderBy: { name: 'asc' },
    })
    return res.status(200).json({ sessionTypes: types })
  } catch (error) {
    console.error('Fetch session types error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 2. Get all attendance sessions
export const getSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await prisma.attendanceSession.findMany({
      include: {
        sessionType: true,
      },
      orderBy: { date: 'desc' },
    })
    return res.status(200).json({ sessions })
  } catch (error) {
    console.error('Fetch sessions error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 3. Create a new session
export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = createSessionSchema.parse(req.body)

    const session = await prisma.attendanceSession.create({
      data: {
        date: new Date(validated.date),
        name: validated.name,
        sessionTypeId: validated.sessionTypeId,
      },
      include: {
        sessionType: true,
      },
    })

    return res.status(201).json({
      message: 'Session created successfully',
      session,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Create session error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 4. Fetch the full grid checklist for a specific session
export const getSessionChecklist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { sessionType: true },
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' })
    }

    // Fetch all active members
    const members = await prisma.member.findMany({
      where: { isDeleted: false },
      include: {
        group: {
          select: {
            groupName: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    // Fetch existing attendance records for this session
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId },
    })

    // Map members to their attendance state
    const checklist = members.map((member) => {
      const record = records.find((r) => r.memberId === member.id)
      return {
        memberId: member.id,
        publicId: member.publicId,
        firstName: member.firstName,
        lastName: member.lastName,
        alias: member.alias || `${member.firstName} ${member.lastName}`,
        groupName: member.group?.groupName || 'No Group',
        status: member.status, // ACTIVE, INACTIVE, etc.
        attendanceStatus: record ? record.status : 'ABSENT', // Default to ABSENT if no record
        attendanceRecordId: record ? record.id : null,
        method: record ? record.method : null,
        scannedAt: record ? record.scannedAt : null,
      }
    })

    return res.status(200).json({
      session,
      checklist,
    })
  } catch (error) {
    console.error('Get checklist error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 5. Toggle or record attendance (Manual / Barcode / Face Scanner)
export const toggleAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = toggleSchema.parse(req.body)

    // Check if session and member exist
    const session = await prisma.attendanceSession.findUnique({
      where: { id: validated.sessionId },
    })
    const member = await prisma.member.findUnique({
      where: { id: validated.memberId, isDeleted: false },
    })

    if (!session || !member) {
      return res.status(404).json({ error: 'Session or Member not found.' })
    }

    // Update or create AttendanceRecord (upsert)
    const record = await prisma.attendanceRecord.upsert({
      where: {
        memberId_sessionId: {
          memberId: validated.memberId,
          sessionId: validated.sessionId,
        },
      },
      update: {
        status: validated.status,
        method: validated.method,
        scannedAt: validated.status === 'PRESENT' ? new Date() : null,
      },
      create: {
        memberId: validated.memberId,
        sessionId: validated.sessionId,
        status: validated.status,
        method: validated.method,
        scannedAt: validated.status === 'PRESENT' ? new Date() : null,
      },
    })

    return res.status(200).json({
      message: 'Attendance recorded successfully',
      record,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Toggle attendance error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 6. Excel Importer - Reads attendance spreadsheet and uploads automatically
export const importAttendanceExcel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = excelImportSchema.parse(req.body)

    // Decode base64
    const buffer = Buffer.from(validated.fileBase64.replace(/^data:.*;base64,/, ''), 'base64')

    // Read workbook
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert sheet to raw array of arrays or JSON
    const rows = xlsx.utils.sheet_to_json<any>(worksheet)

    if (rows.length === 0) {
      return res.status(400).json({ error: 'The uploaded spreadsheet is empty.' })
    }

    console.log(`📊 Parsing Excel: Found ${rows.length} rows inside sheet "${sheetName}".`)

    // We'll perform transactions to safely create session and logs
    let recordsCreated = 0
    let sessionsFoundOrCreated = 0

    // Fetch all members to match by PublicId or Alias
    const allMembers = await prisma.member.findMany({
      where: { isDeleted: false },
    })

    // Fetch the session type
    const sessionType = await prisma.sessionType.findUnique({
      where: { id: validated.sessionTypeId },
    })

    if (!sessionType) {
      return res.status(400).json({ error: 'Selected Session Type is invalid.' })
    }

    // Detect session date columns
    // We assume column names containing dates represent sessions (e.g. "2026-04-01" or "PM - April 1" or "WS")
    const sampleRowKeys = Object.keys(rows[0])
    const sessionKeys = sampleRowKeys.filter(
      (key) =>
        key.toLowerCase() !== 'public id' &&
        key.toLowerCase() !== 'publicid' &&
        key.toLowerCase() !== 'name' &&
        key.toLowerCase() !== 'alias' &&
        key.toLowerCase() !== 'group' &&
        key.toLowerCase() !== 'leader'
    )

    if (sessionKeys.length === 0) {
      return res.status(400).json({
        error: 'No attendance session columns detected. Please ensure columns represent session dates.',
      })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Resolve or create sessions for each column
      const sessionMap: { [key: string]: string } = {}

      for (const col of sessionKeys) {
        // Try parsing column name to date (e.g. "PM - April 1, 2026" or raw date)
        let sessionDate = new Date()
        const cleanedCol = col.replace(/^(WS|PM|TG)\s*-\s*/i, '') // Remove abbreviation prefixes
        const parsedDate = Date.parse(cleanedCol)

        if (!isNaN(parsedDate)) {
          sessionDate = new Date(parsedDate)
        }

        // Check if session already exists
        let session = await tx.attendanceSession.findFirst({
          where: {
            name: col,
            sessionTypeId: sessionType.id,
          },
        })

        if (!session) {
          session = await tx.attendanceSession.create({
            data: {
              name: col,
              date: sessionDate,
              sessionTypeId: sessionType.id,
            },
          })
          sessionsFoundOrCreated++
        }

        sessionMap[col] = session.id
      }

      // 2. Parse attendance rows
      for (const row of rows) {
        // Identify member by Public ID or Alias
        const publicIdVal = String(row['Public ID'] || row['PublicID'] || '').trim()
        const aliasVal = String(row['Alias'] || row['Name'] || '').trim()

        const member = allMembers.find(
          (m) =>
            (publicIdVal && m.publicId.toLowerCase() === publicIdVal.toLowerCase()) ||
            (aliasVal && m.alias?.toLowerCase() === aliasVal.toLowerCase()) ||
            (aliasVal && `${m.firstName} ${m.lastName}`.toLowerCase() === aliasVal.toLowerCase())
        )

        if (!member) {
          console.warn(`⚠️ Warning: Could not match member with ID "${publicIdVal}" or Name "${aliasVal}" in database. Skipping row.`)
          continue
        }

        // Toggle record state for each session column
        for (const col of sessionKeys) {
          const cellValue = String(row[col] || '').trim().toLowerCase()
          const sessionId = sessionMap[col]

          // Determine status: "1", "present", "p", "/" -> PRESENT
          // "0", "absent", "a", "x" -> ABSENT
          // "t", "transferred" -> TRANSFERRED
          let status = 'ABSENT'
          if (
            cellValue === '1' ||
            cellValue === 'present' ||
            cellValue === 'p' ||
            cellValue === '/' ||
            cellValue === 'yes'
          ) {
            status = 'PRESENT'
          } else if (cellValue === 't' || cellValue === 'transferred') {
            status = 'TRANSFERRED'
          }

          await tx.attendanceRecord.upsert({
            where: {
              memberId_sessionId: {
                memberId: member.id,
                sessionId,
              },
            },
            update: {
              status,
              method: 'MANUAL',
            },
            create: {
              memberId: member.id,
              sessionId,
              status,
              method: 'MANUAL',
            },
          })

          recordsCreated++
        }
      }
    })

    return res.status(200).json({
      message: 'Excel spreadsheet parsed successfully!',
      sessionsProcessed: sessionKeys.length,
      newSessionsCreated: sessionsFoundOrCreated,
      attendanceRecordsUpdated: recordsCreated,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Excel Import Error:', error)
    return res.status(500).json({ error: 'Failed to process Excel spreadsheet file.' })
  }
}
