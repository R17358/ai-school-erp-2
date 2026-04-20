// backend/src/routes/salary.routes.js
const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middleware/auth.middleware');
const { prisma } = require('../prisma/client');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');

// GET salary slips (own or all for admin)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const isAdmin = ['SUPER_ADMIN','PRINCIPAL'].includes(req.user.role);
    const { month, year, employeeId } = req.query;
    const where = isAdmin
      ? { academicYear: { school: { id: req.user.schoolId } }, ...(month && { month: Number(month) }), ...(year && { year: Number(year) }), ...(employeeId && { employeeId }) }
      : { employeeId: req.user.id, ...(month && { month: Number(month) }), ...(year && { year: Number(year) }) };

    const slips = await prisma.salarySlip.findMany({
      where,
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        staff: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return res.json(new ApiResponse(200, slips));
  } catch (e) { next(e); }
});

// POST generate salary slips for all employees
router.post('/generate', authenticate, checkPermission('salary', 'create'), async (req, res, next) => {
  try {
    const { month, year, academicYearId } = req.body;
    const [teachers, staff] = await Promise.all([
      prisma.teacher.findMany({ where: { user: { schoolId: req.user.schoolId, isActive: true } } }),
      prisma.staff.findMany({ where: { user: { schoolId: req.user.schoolId, isActive: true } } }),
    ]);

    const slips = [];
    for (const t of teachers) {
      const basic = t.salary || 30000;
      const hra = basic * 0.2;
      const da = basic * 0.12;
      const pf = basic * 0.12;
      const gross = basic + hra + da;
      const net = gross - pf;
      slips.push({ employeeId: t.userId, employeeType: 'TEACHER', teacherId: t.id, academicYearId, month, year, basicSalary: basic, hra, da, pf, grossSalary: gross, netSalary: net });
    }
    for (const s of staff) {
      const basic = s.salary || 20000;
      const hra = basic * 0.1;
      const pf = basic * 0.12;
      const gross = basic + hra;
      const net = gross - pf;
      slips.push({ employeeId: s.userId, employeeType: 'STAFF', staffId: s.id, academicYearId, month, year, basicSalary: basic, hra, pf, grossSalary: gross, netSalary: net });
    }

    const created = await prisma.$transaction(
      slips.map(slip => prisma.salarySlip.upsert({
        where: { employeeId_month_year: { employeeId: slip.employeeId, month: slip.month, year: slip.year } },
        create: slip,
        update: slip,
      }))
    );

    return res.json(new ApiResponse(200, { count: created.length }, `${created.length} salary slips generated`));
  } catch (e) { next(e); }
});

// PATCH mark salary as paid
router.patch('/:id/pay', authenticate, checkPermission('salary', 'update'), async (req, res, next) => {
  try {
    const { paymentMode } = req.body;
    const slip = await prisma.salarySlip.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidDate: new Date(), paymentMode }
    });
    return res.json(new ApiResponse(200, slip, 'Salary marked as paid'));
  } catch (e) { next(e); }
});

module.exports = router;
