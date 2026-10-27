const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/studentController');

router.route('/').get(h(c.getStudents)).post(h(c.createStudent));

// Many-to-many relationship management (enrollments)
router.get('/:id/courses', h(c.getStudentCourses));
router.route('/:id/courses/:courseId').post(h(c.enroll)).delete(h(c.unenroll));

router.route('/:id').get(h(c.getStudentById)).put(h(c.updateStudent)).delete(h(c.deleteStudent));

module.exports = router;
