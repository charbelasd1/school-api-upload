const Course = require('../models/mongo/Course');
const Teacher = require('../models/mongo/Teacher');
const Student = require('../models/mongo/Student');
const ApiError = require('../utils/ApiError');
const logAction = require('../utils/audit');

// Make sure the referenced teacher really exists (MongoDB does not enforce foreign keys)
async function ensureTeacherExists(teacherId) {
  if (!teacherId) return;
  const exists = await Teacher.exists({ _id: teacherId });
  if (!exists) throw new ApiError(400, `Teacher ${teacherId} does not exist`);
}

// POST /api/courses
exports.createCourse = async (req, res) => {
  await ensureTeacherExists(req.body.teacher);
  const course = await Course.create(req.body);
  await logAction('CREATE', 'Course', course._id, `Created course ${course.code}`, req.body);
  res.status(201).json(course);
};

// GET /api/courses  (optional: ?teacher=<id>, ?minCredits=3)
exports.getCourses = async (req, res) => {
  const filter = {};
  if (req.query.teacher) filter.teacher = req.query.teacher;
  if (req.query.minCredits) filter.credits = { $gte: Number(req.query.minCredits) };

  const courses = await Course.find(filter)
    .populate('teacher', 'name email department') // replace teacher id with teacher data
    .sort({ code: 1 });
  res.json(courses);
};

// GET /api/courses/:id  -> course + its teacher + enrolled students
exports.getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('teacher', 'name email department')
    .populate('students', 'firstName lastName email');
  if (!course) throw new ApiError(404, 'Course not found');
  res.json(course);
};

// GET /api/courses/:id/students  -> the other direction of the many-to-many relationship
exports.getCourseStudents = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  const students = await Student.find({ courses: course._id }).select('-courses');
  res.json(students);
};

// PUT /api/courses/:id  (can also re-assign the course to another teacher)
exports.updateCourse = async (req, res) => {
  await ensureTeacherExists(req.body.teacher);
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('teacher', 'name email');
  if (!course) throw new ApiError(404, 'Course not found');
  await logAction('UPDATE', 'Course', course._id, `Updated course ${course.code}`, req.body);
  res.json(course);
};

// DELETE /api/courses/:id
// Cascade: also remove the course id from every student's `courses` array.
exports.deleteCourse = async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');

  const result = await Student.updateMany(
    { courses: course._id },
    { $pull: { courses: course._id } }
  );

  await logAction('DELETE', 'Course', course._id, `Deleted course ${course.code}`, {
    studentsUnenrolled: result.modifiedCount,
  });
  res.json({
    message: 'Course deleted',
    id: course._id,
    studentsUnenrolled: result.modifiedCount,
  });
};
