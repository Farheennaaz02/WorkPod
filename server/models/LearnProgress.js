import mongoose from 'mongoose';

const LearnProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['dev', 'hr', 'pm', 'ml_intern', 'sd_intern']
  },

  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  cleared: [{
    type: String,
    enum: ['flashcards', 'scenarios', 'quizzes']
  }],

  lastPlayed: { type: Date, default: Date.now }
});

// Optional: Compound index for faster queries
LearnProgressSchema.index({ userId: 1, role: 1 }, { unique: true });

export default mongoose.model('LearnProgress', LearnProgressSchema);