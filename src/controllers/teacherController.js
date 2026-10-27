const Teacher = require('../models/mongo/Teacher');
const Course = require('../models/mongo/Course');
const ApiError = require('../utils/ApiError');
const logAction = require('../utils/audit');

// POST /api/teachers
exports.createTeacher = async (req, res) => {
  const teacher = await Teacher.create(req.body);
  await logAction('CREATE', 'Teacher', teacher._id, `Created teacher ${teacher.name}`, req.body);
  res.status(201).json(teacher);
};

// GET /api/teachers  (optional filter: ?department=Computer Science)
exports.getTeachers = async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  const teachers = await Teacher.find(filter).sort({ name: 1 });
  res.json(teachers);
};

// GET /api/teachers/:id  -> teacher with the list of courses they teach (virtual populate)
exports.getTeacherById = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('courses', 'code title credits');
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.json(teacher);
};

// GET /api/teachers/:id/courses  -> the "many" side of the many-to-one relationship
exports.getTeacherCourses = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  const courses = await Course.find({ teacher: teacher._id }).sort({ code: 1 });
  res.json(courses);
};

// PUT /api/teachers/:id
exports.updateTeacher = async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // return the updated document
    runValidators: true, // apply schema validation on updates too
  });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  await logAction('UPDATE', 'Teacher', teacher._id, `Updated teacher ${teacher.name}`, req.body);
  res.json(teacher);
};

// DELETE /api/teachers/:id
// Referential integrity: refuse to delete a teacher who still has courses assigned.
exports.deleteTeacher = async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  const courseCount = await Course.countDocuments({ teacher: teacher._id });
  if (courseCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete: teacher is assigned to ${courseCount} course(s). Reassign or delete them first.`
    );
  }

  await teacher.deleteOne();
  await logAction('DELETE', 'Teacher', teacher._id, `Deleted teacher ${teacher.name}`);
  res.json({ message: 'Teacher deleted', id: teacher._id });
};
