const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/teacherController');

router.route('/').get(h(c.getTeachers)).post(h(c.createTeacher));
router.get('/:id/courses', h(c.getTeacherCourses));
router.route('/:id').get(h(c.getTeacherById)).put(h(c.updateTeacher)).delete(h(c.deleteTeacher));

module.exports = router;
