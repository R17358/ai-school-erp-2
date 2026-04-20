// backend/src/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SchoolSphere database...');

  // ── Create School ─────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { code: 'DEMO-SCH' },
    update: {},
    create: {
      name: 'Demo Public School',
      code: 'DEMO-SCH',
      address: '123 Education Street',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440001',
      phone: '0712-2345678',
      email: 'admin@demoschool.edu',
      boardType: 'CBSE',
      affiliationNo: 'CBSE/1234567',
      principalName: 'Dr. Ramesh Patil',
      aiProvider: 'gemini',
    },
  });
  console.log(`✅ School: ${school.name} (${school.code})`);

  // ── Academic Year ─────────────────────────────────────
  const ayear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: '2024-25' } },
    update: {},
    create: {
      schoolId: school.id,
      name: '2024-25',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: true,
    },
  });
  console.log(`✅ Academic Year: ${ayear.name}`);

  // ── Departments ────────────────────────────────────────
  const deptNames = ['Science', 'Commerce', 'Arts', 'Languages', 'Physical Education', 'Administration'];
  const departments = {};
  for (const name of deptNames) {
    departments[name] = await prisma.department.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      update: {},
      create: { schoolId: school.id, name },
    });
  }
  console.log(`✅ Departments: ${deptNames.length}`);

  // ── Designations ───────────────────────────────────────
  const desigs = [
    { title: 'Principal', level: 10 },
    { title: 'Vice Principal', level: 9 },
    { title: 'HOD', level: 7 },
    { title: 'Senior Teacher', level: 6 },
    { title: 'Teacher', level: 5 },
    { title: 'Lab Assistant', level: 3 },
    { title: 'Clerk', level: 2 },
    { title: 'Peon', level: 1 },
  ];
  const designations = {};
  for (const d of desigs) {
    designations[d.title] = await prisma.designation.upsert({
      where: { schoolId_title: { schoolId: school.id, title: d.title } },
      update: {},
      create: { schoolId: school.id, ...d },
    });
  }
  console.log(`✅ Designations: ${desigs.length}`);

  // ── Subjects ───────────────────────────────────────────
  const subjectList = [
    { name: 'Mathematics', code: 'MATH', weeklyHours: 6, type: 'THEORY' },
    { name: 'Science', code: 'SCI', weeklyHours: 5, type: 'THEORY' },
    { name: 'English', code: 'ENG', weeklyHours: 5, type: 'LANGUAGE' },
    { name: 'Hindi', code: 'HIN', weeklyHours: 4, type: 'LANGUAGE' },
    { name: 'Social Studies', code: 'SST', weeklyHours: 4, type: 'THEORY' },
    { name: 'Computer Science', code: 'CS', weeklyHours: 3, type: 'THEORY' },
    { name: 'Physical Education', code: 'PE', weeklyHours: 2, type: 'OTHER' },
    { name: 'Art & Craft', code: 'ART', weeklyHours: 2, type: 'OTHER' },
    { name: 'Physics', code: 'PHY', weeklyHours: 5, type: 'THEORY' },
    { name: 'Chemistry', code: 'CHEM', weeklyHours: 5, type: 'THEORY' },
    { name: 'Biology', code: 'BIO', weeklyHours: 5, type: 'THEORY' },
    { name: 'Accountancy', code: 'ACC', weeklyHours: 5, type: 'THEORY' },
    { name: 'Economics', code: 'ECO', weeklyHours: 5, type: 'THEORY' },
  ];
  const subjects = {};
  for (const s of subjectList) {
    subjects[s.name] = await prisma.subject.upsert({
      where: { schoolId_name: { schoolId: school.id, name: s.name } },
      update: {},
      create: { schoolId: school.id, ...s },
    });
  }
  console.log(`✅ Subjects: ${subjectList.length}`);

  // ── Password Hash ──────────────────────────────────────
  const hash = await bcrypt.hash('Demo@123', 12);

  // ── Principal ──────────────────────────────────────────
  const principalUser = await prisma.user.upsert({
    where: { schoolId_email: { schoolId: school.id, email: 'principal@demo.school' } },
    update: {},
    create: {
      schoolId: school.id, email: 'principal@demo.school', phone: '9876543210',
      passwordHash: hash, role: 'PRINCIPAL',
    },
  });
  await prisma.principal.upsert({
    where: { userId: principalUser.id },
    update: {},
    create: { userId: principalUser.id, firstName: 'Dr. Ramesh', lastName: 'Patil', gender: 'Male', qualification: 'PhD Education', experience: 20 },
  });
  console.log(`✅ Principal: Dr. Ramesh Patil`);

  // ── Teachers ───────────────────────────────────────────
  const teacherData = [
    { firstName: 'Sunita', lastName: 'Kulkarni', email: 'teacher@demo.school', subjects: ['Mathematics', 'Physics'], dept: 'Science', desig: 'HOD', salary: 45000 },
    { firstName: 'Rajesh', lastName: 'Mehta', email: 'r.mehta@demo.school', subjects: ['English'], dept: 'Languages', desig: 'Senior Teacher', salary: 38000 },
    { firstName: 'Priya', lastName: 'Joshi', email: 'p.joshi@demo.school', subjects: ['Chemistry', 'Biology'], dept: 'Science', desig: 'Teacher', salary: 32000 },
    { firstName: 'Anil', lastName: 'Rao', email: 'a.rao@demo.school', subjects: ['Social Studies'], dept: 'Arts', desig: 'Teacher', salary: 30000 },
    { firstName: 'Neha', lastName: 'Sharma', email: 'n.sharma@demo.school', subjects: ['Hindi'], dept: 'Languages', desig: 'Teacher', salary: 28000 },
    { firstName: 'Deepak', lastName: 'Kumar', email: 'd.kumar@demo.school', subjects: ['Computer Science'], dept: 'Science', desig: 'Teacher', salary: 35000 },
  ];

  for (const t of teacherData) {
    const tUser = await prisma.user.upsert({
      where: { schoolId_email: { schoolId: school.id, email: t.email } },
      update: {},
      create: { schoolId: school.id, email: t.email, passwordHash: hash, role: 'TEACHER' },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: tUser.id },
      update: {},
      create: {
        userId: tUser.id,
        firstName: t.firstName, lastName: t.lastName,
        gender: 'Female', experience: 8, salary: t.salary,
        departmentId: departments[t.dept]?.id,
        designationId: designations[t.desig]?.id,
        specialization: t.subjects.join(', '),
        employeeCode: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      },
    });
    // Assign subjects
    for (const sName of t.subjects) {
      if (subjects[sName]) {
        await prisma.teacherSubject.upsert({
          where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: subjects[sName].id } },
          update: {},
          create: { teacherId: teacher.id, subjectId: subjects[sName].id },
        });
      }
    }
  }
  console.log(`✅ Teachers: ${teacherData.length}`);

  // ── Staff ──────────────────────────────────────────────
  const staffData = [
    { firstName: 'Sanjay', lastName: 'Bhosale', email: 'accountant@demo.school', staffType: 'ACCOUNTANT', salary: 25000 },
    { firstName: 'Ravi', lastName: 'Khote', email: 'watchman@demo.school', staffType: 'WATCHMAN', salary: 15000 },
    { firstName: 'Geeta', lastName: 'More', email: 'librarian@demo.school', staffType: 'LIBRARIAN', salary: 22000 },
  ];

  for (const s of staffData) {
    const roleMap = { WATCHMAN: 'WATCHMAN', PEON: 'PEON' };
    const sUser = await prisma.user.upsert({
      where: { schoolId_email: { schoolId: school.id, email: s.email } },
      update: {},
      create: { schoolId: school.id, email: s.email, passwordHash: hash, role: roleMap[s.staffType] || 'STAFF' },
    });
    await prisma.staff.upsert({
      where: { userId: sUser.id },
      update: {},
      create: { userId: sUser.id, firstName: s.firstName, lastName: s.lastName, staffType: s.staffType, salary: s.salary, departmentId: departments['Administration']?.id },
    });
  }
  console.log(`✅ Staff: ${staffData.length}`);

  // ── Classes ────────────────────────────────────────────
  const classData = [
    { name: '9', section: 'A', capacity: 45 },
    { name: '9', section: 'B', capacity: 45 },
    { name: '10', section: 'A', capacity: 45 },
    { name: '10', section: 'B', capacity: 45 },
    { name: '11', section: 'Science', capacity: 40 },
    { name: '11', section: 'Commerce', capacity: 40 },
    { name: '12', section: 'Science', capacity: 40 },
    { name: '12', section: 'Commerce', capacity: 40 },
  ];

  const classes = {};
  for (const c of classData) {
    const key = `${c.name}-${c.section}`;
    classes[key] = await prisma.class.upsert({
      where: { schoolId_academicYearId_name_section: { schoolId: school.id, academicYearId: ayear.id, name: c.name, section: c.section } },
      update: {},
      create: { schoolId: school.id, academicYearId: ayear.id, ...c },
    });
  }
  console.log(`✅ Classes: ${classData.length}`);

  // ── Students ───────────────────────────────────────────
  const studentNames = [
    ['Aarav','Sharma'], ['Priya','Patel'], ['Rohan','Verma'], ['Sneha','Gupta'], ['Arjun','Singh'],
    ['Kavya','Mehta'], ['Dev','Joshi'], ['Ananya','Rao'], ['Varun','Nair'], ['Ishaan','Reddy'],
    ['Diya','Mishra'], ['Karan','Kapoor'], ['Riya','Agarwal'], ['Aditya','Bhatt'], ['Pooja','Iyer'],
  ];

  const classKeys = Object.keys(classes);
  for (let i = 0; i < studentNames.length; i++) {
    const [first, last] = studentNames[i];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@student.demo.school`;
    const classKey = classKeys[i % classKeys.length];
    const cls = classes[classKey];
    const sUser = await prisma.user.upsert({
      where: { schoolId_email: { schoolId: school.id, email } },
      update: {},
      create: { schoolId: school.id, email, passwordHash: hash, role: 'STUDENT' },
    });
    await prisma.student.upsert({
      where: { userId: sUser.id },
      update: {},
      create: {
        userId: sUser.id,
        firstName: first, lastName: last,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        admissionNo: `ADM2024${String(i + 1).padStart(3, '0')}`,
        rollNo: String(i + 1).padStart(2, '0'),
        classId: cls.id,
        dob: new Date(`200${4 + (i % 6)}-${String((i % 12) + 1).padStart(2, '0')}-15`),
        bloodGroup: ['A+','B+','O+','AB+'][i % 4],
        category: ['General','OBC','SC','ST'][i % 4],
      },
    });
  }
  console.log(`✅ Students: ${studentNames.length}`);

  // ── Demo Student User (for easy login) ────────────────
  const studentLoginUser = await prisma.user.upsert({
    where: { schoolId_email: { schoolId: school.id, email: 'student@demo.school' } },
    update: {},
    create: { schoolId: school.id, email: 'student@demo.school', passwordHash: hash, role: 'STUDENT' },
  });
  await prisma.student.upsert({
    where: { userId: studentLoginUser.id },
    update: {},
    create: {
      userId: studentLoginUser.id,
      firstName: 'Aarav', lastName: 'Demo',
      admissionNo: 'ADM2024099',
      rollNo: '99',
      classId: classes['10-A'].id,
      gender: 'Male',
    },
  });

  // ── Fee Structures ─────────────────────────────────────
  const feeStructures = [
    { className: '9', feeType: 'Tuition', amount: 4000, frequency: 'MONTHLY', dueDay: 10, lateFine: 100, academicYear: '2024-25' },
    { className: '10', feeType: 'Tuition', amount: 4500, frequency: 'MONTHLY', dueDay: 10, lateFine: 100, academicYear: '2024-25' },
    { className: '11', feeType: 'Tuition', amount: 5000, frequency: 'MONTHLY', dueDay: 10, lateFine: 150, academicYear: '2024-25' },
    { className: '12', feeType: 'Tuition', amount: 5500, frequency: 'MONTHLY', dueDay: 10, lateFine: 150, academicYear: '2024-25' },
    { className: 'ALL', feeType: 'Library', amount: 1200, frequency: 'ANNUALLY', dueDay: null, lateFine: 0, academicYear: '2024-25' },
    { className: 'ALL', feeType: 'Sports', amount: 800, frequency: 'ANNUALLY', dueDay: null, lateFine: 0, academicYear: '2024-25' },
  ];
  for (const fs of feeStructures) {
    await prisma.feeStructure.create({ data: { schoolId: school.id, ...fs } }).catch(() => {});
  }
  console.log(`✅ Fee Structures: ${feeStructures.length}`);

  // ── Holidays ───────────────────────────────────────────
  const holidays = [
    { name: 'Republic Day', date: '2025-01-26', type: 'NATIONAL' },
    { name: 'Holi', date: '2025-03-14', type: 'FESTIVAL' },
    { name: 'Independence Day', date: '2024-08-15', type: 'NATIONAL' },
    { name: 'Gandhi Jayanti', date: '2024-10-02', type: 'NATIONAL' },
    { name: 'Diwali', date: '2024-11-01', type: 'FESTIVAL' },
    { name: 'Christmas', date: '2024-12-25', type: 'FESTIVAL' },
    { name: 'Annual Day', date: '2024-12-20', type: 'SCHOOL' },
    { name: 'Sports Day', date: '2024-11-15', type: 'SCHOOL' },
  ];
  for (const h of holidays) {
    await prisma.holiday.create({ data: { schoolId: school.id, ...h, date: new Date(h.date) } }).catch(() => {});
  }
  console.log(`✅ Holidays: ${holidays.length}`);

  // ── Leave Types ────────────────────────────────────────
  const leaveTypes = [
    { name: 'Casual Leave', code: 'CL', maxDays: 12, isPaid: true, carryForward: false },
    { name: 'Sick Leave', code: 'SL', maxDays: 12, isPaid: true, carryForward: false },
    { name: 'Earned Leave', code: 'EL', maxDays: 18, isPaid: true, carryForward: true },
    { name: 'Maternity Leave', code: 'ML', maxDays: 180, isPaid: true, carryForward: false },
    { name: 'Paternity Leave', code: 'PL', maxDays: 15, isPaid: true, carryForward: false },
    { name: 'Leave Without Pay', code: 'LWP', maxDays: 30, isPaid: false, carryForward: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    }).catch(() => {});
  }
  console.log(`✅ Leave Types: ${leaveTypes.length}`);

  // ── Notices ────────────────────────────────────────────
  const notices = [
    { title: 'Annual Day Celebration', content: 'Annual Day will be celebrated on 20th December 2024. All students and parents are invited.', audience: ['ALL'], isUrgent: false },
    { title: 'Unit Test 3 Schedule', content: 'Unit Test 3 will be conducted from 15th November 2024. Timetable attached.', audience: ['STUDENT','PARENT','TEACHER'], isUrgent: true },
    { title: 'Staff Meeting', content: 'Mandatory staff meeting on Saturday at 10 AM in the conference room.', audience: ['TEACHER','STAFF'], isUrgent: false },
    { title: 'Fee Reminder', content: 'October fees are due by 10th October. Late fee of ₹100/day will be charged after due date.', audience: ['STUDENT','PARENT'], isUrgent: true },
  ];
  for (const n of notices) {
    await prisma.notice.create({ data: { schoolId: school.id, ...n, postedBy: principalUser.id } }).catch(() => {});
  }
  console.log(`✅ Notices: ${notices.length}`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('   School Code: DEMO-SCH');
  console.log('   Principal:   principal@demo.school / Demo@123');
  console.log('   Teacher:     teacher@demo.school / Demo@123');
  console.log('   Student:     student@demo.school / Demo@123');
  console.log('   Accountant:  accountant@demo.school / Demo@123');
  console.log('   Watchman:    watchman@demo.school / Demo@123\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
