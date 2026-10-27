// Course
//  - many-to-one: many Courses -> one Teacher (stored as `teacher` ObjectId reference)
//  - many-to-many: Courses <-> Students (the list is stored on the Student side, see Student.js)
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: { type: String, required: [true, 'title is required'], trim: true },
    credits: {
      type: Number,
      required: [true, 'credits is required'],
      min: [1, 'credits must be at least 1'],
      max: [6, 'credits cannot exceed 6'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'teacher is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: students enrolled in this course (Students whose `courses` array contains this _id)
courseSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'courses',
});

module.exports = mongoose.model('Course', courseSchema);
