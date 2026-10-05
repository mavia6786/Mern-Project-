// Same staff endpoints for both verticals: mounted under /api/shoes/salesmen and /api/clothes/salesmen
const express = require('express');

module.exports = (ctrl) => {
  const r = express.Router();
  r.get('/', ctrl.getAll);
  r.get('/active', ctrl.getActive);
  r.get('/salary-reports', ctrl.getAllSalaryReports);
  r.post('/', ctrl.create);
  r.get('/:id', ctrl.getById);
  r.put('/:id', ctrl.update);
  r.delete('/:id', ctrl.remove);

  r.get('/:id/attendance', ctrl.getAttendance);
  r.get('/:id/attendance/present-days', ctrl.getPresentDays);
  r.post('/:id/attendance', ctrl.markAttendance);

  r.get('/:id/salary-report', ctrl.getSalaryReport);
  r.post('/:id/salary/pay', ctrl.markSalaryPaid);
  r.post('/:id/salary/undo', ctrl.undoSalaryPaid);
  r.post('/:id/salary/bonus', ctrl.addBonus);

  r.get('/:id/advances', ctrl.getAdvances);
  r.post('/:id/advances', ctrl.addAdvance);
  r.delete('/:id/advances/:advanceId', ctrl.deleteAdvance);
  return r;
};
