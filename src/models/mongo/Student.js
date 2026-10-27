// Student: holds the many-to-many relationship with Course as an array of ObjectId references.
// We store the array on ONE side only (single source of truth) and expose the other
// direction (Course -> students) through a virtual populate in Course.js.
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'firstName is required'], trim: true },
    lastName: { type: String, required: [true, 'lastName is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'email is invalid'],
    },
    major: { type: String, trim: true },
    year: { type: Number, min: 1, max: 5, default: 1 },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
