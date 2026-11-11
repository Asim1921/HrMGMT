import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('SuperAdmin@101', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@101hrmgmt.local' },
    update: { designation: 'COMDT', approvalLevel: 3, reportingToId: null },
    create: {
      employeeId: 'MIL-0001',
      fullName: 'Super Administrator',
      email: 'superadmin@101hrmgmt.local',
      passwordHash: hash,
      role: 'super_admin',
      rank: 'Comdt',
      unit: 'HQ',
      designation: 'COMDT',
      approvalLevel: 3,
      status: 'active',
    },
  });
  console.log('Seeded super_admin (Comdt):', superAdmin.email);

  const g1Hash = await bcrypt.hash('G1@101', 10);
  const g1 = await prisma.user.upsert({
    where: { email: 'offr.g1@101hrmgmt.local' },
    update: { designation: 'OFFICER', approvalLevel: 2, reportingToId: superAdmin.id },
    create: {
      employeeId: 'MIL-0003',
      fullName: 'Offr G-1',
      email: 'offr.g1@101hrmgmt.local',
      passwordHash: g1Hash,
      role: 'admin',
      rank: 'Offr G-1',
      unit: 'HQ',
      designation: 'OFFICER',
      approvalLevel: 2,
      reportingToId: superAdmin.id,
      status: 'active',
    },
  });
  console.log('Seeded G-1:', g1.email);

  const g2Hash = await bcrypt.hash('G2@101', 10);
  const g2 = await prisma.user.upsert({
    where: { email: 'offr.g2@101hrmgmt.local' },
    update: { designation: 'OFFICER', approvalLevel: 1, reportingToId: g1.id },
    create: {
      employeeId: 'MIL-0002',
      fullName: 'Offr G-2',
      email: 'offr.g2@101hrmgmt.local',
      passwordHash: g2Hash,
      role: 'admin',
      rank: 'Offr G-2',
      unit: 'HQ',
      designation: 'OFFICER',
      approvalLevel: 1,
      reportingToId: g1.id,
      status: 'active',
    },
  });
  console.log('Seeded G-2:', g2.email);

  const interneeHash = await bcrypt.hash('Internee@101', 10);
  const internee = await prisma.user.upsert({
    where: { email: 'internee@101hrmgmt.local' },
    update: { designation: 'INTERNEE', reportingToId: g2.id },
    create: {
      employeeId: 'MIL-0004',
      fullName: 'Internee One',
      email: 'internee@101hrmgmt.local',
      passwordHash: interneeHash,
      role: 'user',
      rank: 'Internee',
      unit: 'HQ',
      designation: 'INTERNEE',
      reportingToId: g2.id,
      status: 'active',
    },
  });
  console.log('Seeded Internee:', internee.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
