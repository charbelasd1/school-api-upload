const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/courseController');

router.route('/').get(h(c.getCourses)).post(h(c.createCourse));
router.get('/:id/students', h(c.getCourseStudents));
router.route('/:id').get(h(c.getCourseById)).put(h(c.updateCourse)).delete(h(c.deleteCourse));

module.exports = router;
