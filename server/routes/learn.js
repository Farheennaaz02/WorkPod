import express from 'express';
import Question from '../models/Question.js';
import LearnProgress from '../models/LearnProgress.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get content + progress
router.get('/content/:role/:userid', requireAuth, async (req, res) => {
  try {
    // console.log("Request",req);
    const { role, userid } = req.params;
    const questions = await Question.find({ role }).lean();

    let progress = await LearnProgress.findOne({ userId: userid, role });

    if (!progress) {
      progress = await LearnProgress.create({ userId: userid, role });
    }

    const grouped = {
      flashcards: questions.filter(q => q.type === 'flashcard'),
      scenarios: questions.filter(q => q.type === 'scenario'),
      quizzes: questions.filter(q => q.type === 'quiz')
    };

    res.json({
      content: grouped,
      progress: {
        xp: progress.xp,
        coins: progress.coins,
        level: progress.level,
        cleared: progress.cleared || []
      }
    });
  } catch (err) {
    console.log("Errorq23123321",err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update progress
router.post('/progress', requireAuth, async (req, res) => {
  try {
    const { role, xp = 0, coins = 0, module, userId } = req.body;

    let progress = await LearnProgress.findOne({ userId: userId, role });
    if (!progress) {
      progress = new LearnProgress({ userId: userId, role });
    }

    progress.xp += xp;
    progress.coins += coins;
    progress.lastPlayed = new Date();

    if (module && !progress.cleared.includes(module)) {
      progress.cleared.push(module);
    }

    // Level up logic
    while (progress.xp >= progress.level * 100) {
      progress.xp -= progress.level * 100;
      progress.level++;
    }

    await progress.save();
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update progress' });
  }
});

export default router;