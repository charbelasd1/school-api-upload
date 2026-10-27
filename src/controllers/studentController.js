const mongoose = require('mongoose');
const Student = require('../models/mongo/Student');
const Course = require('../models/mongo/Course');
const ApiError = require('../utils/ApiError');
const logAction = require('../utils/audit');

// Validate that every id in a `courses` array points to an existing course
async function ensureCoursesExist(courseIds) {
  if (!courseIds) return;
  if (!Array.isArray(courseIds)) throw new ApiError(400, 'courses must be an array of ids');
  const invalid = courseIds.filter((id) => !mongoose.isValidObjectId(id));
  if (invalid.length) throw new ApiError(400, `Invalid course id(s): ${invalid.join(', ')}`);
  const found = await Course.countDocuments({ _id: { $in: courseIds } });
  if (found !== new Set(courseIds.map(String)).size) {
    throw new ApiError(400, 'One or more courses do not exist');
  }
}

// POST /api/students  (may include an initial "courses": [ids])
exports.createStudent = async (req, res) => {
  await ensureCoursesExist(req.body.courses);
  const student = await Student.create(req.body);
  await logAction('CREATE', 'Student', student._id, `Created student ${student.email}`, req.body);
  res.status(201).json(student);
};

// GET /api/students  (optional: ?major=Computer Science, ?year=2)
exports.getStudents = async (req, res) => {
  const filter = {};
  if (req.query.major) filter.major = req.query.major;
  if (req.query.year) filter.year = Number(req.query.year);
  const students = await Student.find(filter)
    .populate('courses', 'code title')
    .sort({ lastName: 1 });
  res.json(students);
};

// GET /api/students/:id  -> student with full course info and each course's teacher (nested populate)
exports.getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id).populate({
    path: 'courses',
    select: 'code title credits teacher',
    populate: { path: 'teacher', select: 'name email' },
  });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json(student);
};

// GET /api/students/:id/courses
exports.getStudentCourses = async (req, res) => {
  const student = await Student.findById(req.params.id).populate({
    path: 'courses',
    populate: { path: 'teacher', select: 'name' },
  });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json(student.courses);
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  await ensureCoursesExist(req.body.courses);
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!student) throw new ApiError(404, 'Student not found');
  await logAction('UPDATE', 'Student', student._id, `Updated student ${student.email}`, req.body);
  res.json(student);
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  await logAction('DELETE', 'Student', student._id, `Deleted student ${student.email}`);
  res.json({ message: 'Student deleted', id: student._id });
};

// POST /api/students/:id/courses/:courseId  -> enroll (adds one link in the many-to-many)
exports.enroll = async (req, res) => {
  const { id, courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'Course not found');

  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, 'Student not found');
  if (student.courses.some((c) => c.equals(course._id))) {
    throw new ApiError(409, `Student is already enrolled in ${course.code}`);
  }

  // $addToSet adds the id only if it is not already in the array (no duplicates)
  const updated = await Student.findByIdAndUpdate(
    id,
    { $addToSet: { courses: course._id } },
    { new: true }
  ).populate('courses', 'code title');

  await logAction('ENROLL', 'Student', id, `${student.email} enrolled in ${course.code}`, {
    courseId,
  });
  res.status(201).json(updated);
};

// DELETE /api/students/:id/courses/:courseId  -> unenroll (removes one link)
exports.unenroll = async (req, res) => {
  const { id, courseId } = req.params;
  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, 'Student not found');
  if (!student.courses.some((c) => c.equals(courseId))) {
    throw new ApiError(404, 'Student is not enrolled in this course');
  }

  const updated = await Student.findByIdAndUpdate(
    id,
    { $pull: { courses: courseId } },
    { new: true }
  ).populate('courses', 'code title');

  await logAction('UNENROLL', 'Student', id, `${student.email} dropped course ${courseId}`, {
    courseId,
  });
  res.json(updated);
};
