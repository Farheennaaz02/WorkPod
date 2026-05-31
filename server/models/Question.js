import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  text: String,
  xp: Number,
  coins: Number,
  ok: Boolean,
  fb: String
});

const QuestionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['dev', 'hr', 'pm', 'ml_intern', 'sd_intern'],
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['flashcard', 'quiz', 'scenario']
  },

  // Flashcard
  q: { type: String, required: true },
  a: { type: String },

  // Quiz
  opts: [String],
  correct: Number,

  // Scenario
  title: String,
  desc: String,
  options: [OptionSchema],

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Question', QuestionSchema);