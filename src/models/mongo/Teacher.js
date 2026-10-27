// Teacher: the "one" side of the many-to-one relationship (Course -> Teacher).
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'email is invalid'],
    },
    department: { type: String, trim: true },
    hireDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual (not stored) field: all courses whose `teacher` field points to this teacher.
// Lets us do Teacher.findById(id).populate('courses')
teacherSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'teacher',
});

module.exports = mongoose.model('Teacher', teacherSchema);
