import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Clean existing records (Transaction order to prevent foreign key issues)
  await prisma.attendanceRecord.deleteMany()
  await prisma.attendanceSession.deleteMany()
  await prisma.sessionType.deleteMany()
  await prisma.faceEmbedding.deleteMany()
  await prisma.group.deleteMany()
  await prisma.memberAddress.deleteMany()
  await prisma.address.deleteMany()
  await prisma.member.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing database tables.')

  // 2. Hash default password
  const hashedPassword = await bcrypt.hash('Password123!', 10)

  // 3. Seed System Operators (Users)
  const superAdmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  const elder = await prisma.user.create({
    data: {
      username: 'elder.juan',
      password: hashedPassword,
      role: 'ELDER',
    },
  })

  const officer = await prisma.user.create({
    data: {
      username: 'officer.maria',
      password: hashedPassword,
      role: 'OFFICER',
    },
  })

  console.log('👤 Seeded system operators.')

  // 4. Seed Dynamic Session Types
  const pmType = await prisma.sessionType.create({
    data: {
      name: 'Prayer Meeting',
      shortName: 'PM',
      description: 'Weekly mid-week congregational prayer meeting',
    },
  })

  const wsType = await prisma.sessionType.create({
    data: {
      name: 'Worship Service',
      shortName: 'WS',
      description: 'Weekend holy worship congregational assembly',
    },
  })

  const tgType = await prisma.sessionType.create({
    data: {
      name: 'Thanksgiving',
      shortName: 'TG',
      description: 'Weekly special thanksgiving offering service',
    },
  })

  console.log('📅 Seeded core SessionTypes (PM, WS, TG).')

  // 5. Seed Addresses (Pampanga coordinates)
  const address1 = await prisma.address.create({
    data: {
      streetAddress: '123 Purok 1',
      barangay: 'Lambac',
      municipality: 'Sasmuan',
      province: 'Pampanga',
      zipCode: '2004',
    },
  })

  const address2 = await prisma.address.create({
    data: {
      streetAddress: '456 Purok 4',
      barangay: 'San Nicolas 2nd',
      municipality: 'Sasmuan',
      province: 'Pampanga',
      zipCode: '2004',
    },
  })

  const address3 = await prisma.address.create({
    data: {
      streetAddress: '789 Purok 2',
      barangay: 'Natividad',
      municipality: 'Guagua',
      province: 'Pampanga',
      zipCode: '2000',
    },
  })

  console.log('📍 Seeded Pampanga barangay addresses.')

  // 6. Seed Members (Directly matching Excel Image 1)
  const edgar = await prisma.member.create({
    data: {
      publicId: 'M130200001',
      firstName: 'Edgar',
      lastName: 'Limpin',
      middleName: 'Gozum',
      alias: 'B. Edgar L',
      age: 48,
      gender: 'MALE',
      civilStatus: 'MARRIED',
      contactNumber: '09171234567',
      baptismDate: new Date('2005-04-12'),
      status: 'ACTIVE',
      incomeLevel: 'MEDIUM',
      yearsInChurch: 21,
    },
  })

  const lorena = await prisma.member.create({
    data: {
      publicId: 'M130200002',
      firstName: 'Lorena',
      lastName: 'Torres',
      middleName: 'Santos',
      alias: 'S. Lorena T',
      age: 42,
      gender: 'FEMALE',
      civilStatus: 'MARRIED',
      contactNumber: '09187654321',
      baptismDate: new Date('2010-09-18'),
      status: 'ACTIVE',
      incomeLevel: 'LOW',
      yearsInChurch: 16,
    },
  })

  const rachel = await prisma.member.create({
    data: {
      publicId: 'M130200003',
      firstName: 'Rachel',
      lastName: 'Tayag',
      middleName: 'Mendoza',
      alias: 'S. Rachel T',
      age: 26,
      gender: 'FEMALE',
      civilStatus: 'SINGLE',
      contactNumber: '09228889999',
      baptismDate: new Date('2018-11-24'),
      status: 'ACTIVE',
      incomeLevel: 'HIGH',
      yearsInChurch: 8,
    },
  })

  const narciso = await prisma.member.create({
    data: {
      publicId: 'M130200004',
      firstName: 'Narciso',
      lastName: 'Miranda',
      middleName: 'Cruz',
      alias: 'B. Narciso M',
      age: 55,
      gender: 'MALE',
      civilStatus: 'MARRIED',
      contactNumber: '09334445555',
      baptismDate: new Date('1998-05-10'),
      status: 'ACTIVE',
      incomeLevel: 'MEDIUM',
      yearsInChurch: 28,
    },
  })

  const arianne = await prisma.member.create({
    data: {
      publicId: 'M130200005',
      firstName: 'Arianne',
      lastName: 'Solis',
      middleName: 'Perez',
      alias: 'S. Arianne S',
      age: 31,
      gender: 'FEMALE',
      civilStatus: 'SINGLE',
      status: 'INACTIVE',
      incomeLevel: 'LOW',
      yearsInChurch: 5,
    },
  })

  console.log('👥 Seeded core church members.')

  // 7. Seed Member-Address Connections
  await prisma.memberAddress.create({
    data: {
      memberId: edgar.id,
      addressId: address1.id,
      addressType: 'PRIMARY',
    },
  })

  await prisma.memberAddress.create({
    data: {
      memberId: lorena.id,
      addressId: address1.id,
      addressType: 'PRIMARY',
    },
  })

  await prisma.memberAddress.create({
    data: {
      memberId: rachel.id,
      addressId: address2.id,
      addressType: 'PRIMARY',
    },
  })

  await prisma.memberAddress.create({
    data: {
      memberId: narciso.id,
      addressId: address3.id,
      addressType: 'PRIMARY',
    },
  })

  await prisma.memberAddress.create({
    data: {
      memberId: arianne.id,
      addressId: address2.id,
      addressType: 'PRIMARY',
    },
  })

  console.log('🔗 Bound members to addresses via MemberAddress junction table.')

  // 8. Seed Grace Cell Group and Leader Relations (B. Edgar Limpin leads the Sasmuan cell group)
  const sasmuanCell = await prisma.group.create({
    data: {
      groupName: 'Sasmuan Grace Cell 1',
      leaderId: edgar.id,
    },
  })

  // Assign members to Sasmuan cell group
  await prisma.member.update({
    where: { id: edgar.id },
    data: { groupId: sasmuanCell.id },
  })

  await prisma.member.update({
    where: { id: lorena.id },
    data: { groupId: sasmuanCell.id },
  })

  await prisma.member.update({
    where: { id: rachel.id },
    data: { groupId: sasmuanCell.id },
  })

  await prisma.member.update({
    where: { id: narciso.id },
    data: { groupId: sasmuanCell.id },
  })

  await prisma.member.update({
    where: { id: arianne.id },
    data: { groupId: sasmuanCell.id },
  })

  console.log('⛪ Established Sasmuan Grace Cell group and bound leader/members recursively.')

  // 9. Seed Attendance Sessions
  const session1 = await prisma.attendanceSession.create({
    data: {
      date: new Date('2026-04-01T19:00:00Z'),
      name: 'PM - April 1, 2026',
      sessionTypeId: pmType.id,
    },
  })

  const session2 = await prisma.attendanceSession.create({
    data: {
      date: new Date('2026-04-04T06:00:00Z'),
      name: 'WS - April 4, 2026',
      sessionTypeId: wsType.id,
    },
  })

  const session3 = await prisma.attendanceSession.create({
    data: {
      date: new Date('2026-04-04T13:00:00Z'),
      name: 'TG - April 4, 2026',
      sessionTypeId: tgType.id,
    },
  })

  console.log('📆 Seeded attendance sessions for April 2026.')

  // 10. Seed Attendance Records (Present/Absent matching Image 1)
  // Edgar L: Present on all
  await prisma.attendanceRecord.createMany({
    data: [
      { memberId: edgar.id, sessionId: session1.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: edgar.id, sessionId: session2.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: edgar.id, sessionId: session3.id, status: 'PRESENT', method: 'MANUAL' },
    ],
  })

  // Lorena T: Present on Session 1, Absent on Session 2, Present on Session 3
  await prisma.attendanceRecord.createMany({
    data: [
      { memberId: lorena.id, sessionId: session1.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: lorena.id, sessionId: session2.id, status: 'ABSENT', method: 'MANUAL' },
      { memberId: lorena.id, sessionId: session3.id, status: 'PRESENT', method: 'MANUAL' },
    ],
  })

  // Rachel T: Present on all
  await prisma.attendanceRecord.createMany({
    data: [
      { memberId: rachel.id, sessionId: session1.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: rachel.id, sessionId: session2.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: rachel.id, sessionId: session3.id, status: 'PRESENT', method: 'MANUAL' },
    ],
  })

  // Narciso M: Present on all
  await prisma.attendanceRecord.createMany({
    data: [
      { memberId: narciso.id, sessionId: session1.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: narciso.id, sessionId: session2.id, status: 'PRESENT', method: 'MANUAL' },
      { memberId: narciso.id, sessionId: session3.id, status: 'PRESENT', method: 'MANUAL' },
    ],
  })

  // Arianne S: Inactive (Absent on all)
  await prisma.attendanceRecord.createMany({
    data: [
      { memberId: arianne.id, sessionId: session1.id, status: 'ABSENT', method: 'MANUAL' },
      { memberId: arianne.id, sessionId: session2.id, status: 'ABSENT', method: 'MANUAL' },
      { memberId: arianne.id, sessionId: session3.id, status: 'ABSENT', method: 'MANUAL' },
    ],
  })

  console.log('✅ Seeded interactive attendance records.')
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
