import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation Schemas
const addressSchema = z.object({
  streetAddress: z.string().min(1),
  barangay: z.string().min(1),
  municipality: z.string().min(1),
  province: z.string().min(1),
  zipCode: z.string().min(4),
})

const createMemberSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  middleName: z.string().optional().nullable(),
  alias: z.string().optional().nullable(),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['MALE', 'FEMALE']),
  civilStatus: z.enum(['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED']),
  contactNumber: z.string().optional().nullable(),
  baptismDate: z.string().optional().nullable(), // ISO string
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DECEASED']).default('ACTIVE'),
  incomeLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  yearsInChurch: z.number().int().min(0).default(0),
  groupId: z.string().optional().nullable(),
  address: addressSchema.optional().nullable(),
})

const updateMemberSchema = createMemberSchema.partial()

// 1. Get All Members (with advanced search & filters)
export const getAllMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, groupId, status, gender } = req.query

    const whereClause: any = {
      isDeleted: false,
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: String(search) } },
        { lastName: { contains: String(search) } },
        { alias: { contains: String(search) } },
        { publicId: { contains: String(search) } },
      ]
    }

    if (groupId) {
      whereClause.groupId = String(groupId)
    }

    if (status) {
      whereClause.status = String(status)
    }

    if (gender) {
      whereClause.gender = String(gender)
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        group: {
          select: {
            id: true,
            groupName: true,
            leaderId: true,
          },
        },
        addresses: {
          include: {
            address: true,
          },
        },
        faceEmbedding: {
          select: {
            id: true, // Only send presence, not raw float text
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    })

    return res.status(200).json({ members })
  } catch (error) {
    console.error('Fetch members error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 2. Get Member by ID
export const getMemberById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const member = await prisma.member.findUnique({
      where: { id, isDeleted: false },
      include: {
        group: true,
        addresses: {
          include: {
            address: true,
          },
        },
        faceEmbedding: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' })
    }

    return res.status(200).json({ member })
  } catch (error) {
    console.error('Fetch member by ID error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 3. Create Member (Transaction-safe)
export const createMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = createMemberSchema.parse(req.body)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Auto-generate incrementing publicId (e.g. M130200001)
      const count = await tx.member.count()
      const nextNum = String(count + 1).padStart(5, '0')
      const publicId = `M1302${nextNum}`

      // 2. Create member
      const member = await tx.member.create({
        data: {
          publicId,
          firstName: validated.firstName,
          lastName: validated.lastName,
          middleName: validated.middleName,
          alias: validated.alias,
          age: validated.age,
          gender: validated.gender,
          civilStatus: validated.civilStatus,
          contactNumber: validated.contactNumber,
          baptismDate: validated.baptismDate ? new Date(validated.baptismDate) : null,
          status: validated.status,
          incomeLevel: validated.incomeLevel,
          yearsInChurch: validated.yearsInChurch,
          groupId: validated.groupId,
        },
      })

      // 3. Create address and link it if provided
      if (validated.address) {
        const addressObj = await tx.address.create({
          data: {
            streetAddress: validated.address.streetAddress,
            barangay: validated.address.barangay,
            municipality: validated.address.municipality,
            province: validated.address.province,
            zipCode: validated.address.zipCode,
          },
        })

        await tx.memberAddress.create({
          data: {
            memberId: member.id,
            addressId: addressObj.id,
            addressType: 'PRIMARY',
          },
        })
      }

      return member
    })

    // Fetch the newly created member with full associations to return
    const newMemberWithRelations = await prisma.member.findUnique({
      where: { id: result.id },
      include: {
        group: true,
        addresses: {
          include: {
            address: true,
          },
        },
      },
    })

    return res.status(201).json({
      message: 'Member registered successfully',
      member: newMemberWithRelations,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Create member error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 4. Update Member (Transaction-safe)
export const updateMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const validated = updateMemberSchema.parse(req.body)

    // Check existence
    const existing = await prisma.member.findUnique({
      where: { id, isDeleted: false },
      include: { addresses: true },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Member not found.' })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Member Details
      await tx.member.update({
        where: { id },
        data: {
          firstName: validated.firstName,
          lastName: validated.lastName,
          middleName: validated.middleName,
          alias: validated.alias,
          age: validated.age,
          gender: validated.gender,
          civilStatus: validated.civilStatus,
          contactNumber: validated.contactNumber,
          baptismDate: validated.baptismDate ? new Date(validated.baptismDate) : undefined,
          status: validated.status,
          incomeLevel: validated.incomeLevel,
          yearsInChurch: validated.yearsInChurch,
          groupId: validated.groupId,
        },
      })

      // 2. Handle Address Updates
      if (validated.address) {
        const primaryAddressConnection = existing.addresses.find(
          (a) => a.addressType === 'PRIMARY'
        )

        if (primaryAddressConnection) {
          // Update existing address
          await tx.address.update({
            where: { id: primaryAddressConnection.addressId },
            data: {
              streetAddress: validated.address.streetAddress,
              barangay: validated.address.barangay,
              municipality: validated.address.municipality,
              province: validated.address.province,
              zipCode: validated.address.zipCode,
            },
          })
        } else {
          // Create a new address connection if none existed
          const addressObj = await tx.address.create({
            data: {
              streetAddress: validated.address.streetAddress,
              barangay: validated.address.barangay,
              municipality: validated.address.municipality,
              province: validated.address.province,
              zipCode: validated.address.zipCode,
            },
          })

          await tx.memberAddress.create({
            data: {
              memberId: id,
              addressId: addressObj.id,
              addressType: 'PRIMARY',
            },
          })
        }
      }
    })

    const updatedMember = await prisma.member.findUnique({
      where: { id },
      include: {
        group: true,
        addresses: {
          include: {
            address: true,
          },
        },
      },
    })

    return res.status(200).json({
      message: 'Member updated successfully',
      member: updatedMember,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Update member error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}

// 5. Soft Delete Member
export const deleteMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const existing = await prisma.member.findUnique({
      where: { id, isDeleted: false },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Member not found.' })
    }

    await prisma.member.update({
      where: { id },
      data: { isDeleted: true },
    })

    return res.status(200).json({ message: 'Member deleted successfully (soft-delete).' })
  } catch (error) {
    console.error('Delete member error:', error)
    return res.status(500).json({ error: 'An unexpected server error occurred.' })
  }
}
