-- CreateTable
CREATE TABLE "DiagnosticSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "formJson" TEXT NOT NULL,
    "mathTrack" TEXT,
    "rwTrack" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiagnosticSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiagnosticResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "chosenAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "timeMs" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "answerChanges" INTEGER NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" DATETIME,
    CONSTRAINT "DiagnosticResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiagnosticResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiagnosticResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mathScore" INTEGER NOT NULL,
    "rwScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "mathLow" INTEGER NOT NULL,
    "mathHigh" INTEGER NOT NULL,
    "rwLow" INTEGER NOT NULL,
    "rwHigh" INTEGER NOT NULL,
    "totalLow" INTEGER NOT NULL,
    "totalHigh" INTEGER NOT NULL,
    "mathTheta" REAL NOT NULL,
    "mathSe" REAL NOT NULL,
    "rwTheta" REAL NOT NULL,
    "rwSe" REAL NOT NULL,
    "confidence" TEXT NOT NULL,
    "accuracyPct" REAL NOT NULL,
    "breakdownJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosticResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiagnosticSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiagnosticResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MistakeDiagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "testing" TEXT NOT NULL,
    "whyWrong" TEXT NOT NULL,
    "whyCorrect" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "nextStep" TEXT NOT NULL,
    "similarJson" TEXT,
    "source" TEXT NOT NULL DEFAULT 'heuristic',
    "model" TEXT,
    "userFeedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MistakeDiagnosis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MistakeDiagnosis_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuestionAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "priorityLabel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "currentMastery" REAL NOT NULL,
    "targetMastery" REAL NOT NULL,
    "recommendedQuestions" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "recommendedDifficulty" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SkillRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlanDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "weekIndex" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "targetMinutes" INTEGER NOT NULL DEFAULT 0,
    "targetQuestions" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudyPlanDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TutorMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL DEFAULT 'main',
    "role" TEXT NOT NULL,
    "mode" TEXT,
    "content" TEXT NOT NULL,
    "dataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ErrorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chosenAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "whyChose" TEXT NOT NULL,
    "whyWrong" TEXT NOT NULL,
    "whyCorrectRight" TEXT NOT NULL,
    "mistakeType" TEXT NOT NULL,
    "whatDifferent" TEXT NOT NULL,
    "confidenceAfter" TEXT NOT NULL,
    "aiReviewStatus" TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
    "aiFeedback" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'practice',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ErrorLog_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuestionAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ErrorLog" ("aiFeedback", "aiReviewStatus", "attemptId", "chosenAnswer", "confidenceAfter", "correctAnswer", "createdAt", "id", "mistakeType", "revisionCount", "updatedAt", "userId", "whatDifferent", "whyChose", "whyCorrectRight", "whyWrong") SELECT "aiFeedback", "aiReviewStatus", "attemptId", "chosenAnswer", "confidenceAfter", "correctAnswer", "createdAt", "id", "mistakeType", "revisionCount", "updatedAt", "userId", "whatDifferent", "whyChose", "whyCorrectRight", "whyWrong" FROM "ErrorLog";
DROP TABLE "ErrorLog";
ALTER TABLE "new_ErrorLog" RENAME TO "ErrorLog";
CREATE UNIQUE INDEX "ErrorLog_attemptId_key" ON "ErrorLog"("attemptId");
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");
CREATE INDEX "ErrorLog_userId_mistakeType_idx" ON "ErrorLog"("userId", "mistakeType");
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "section" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "subskill" TEXT,
    "difficulty" TEXT NOT NULL,
    "questionType" TEXT,
    "satRelevance" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sourceType" TEXT NOT NULL DEFAULT 'OFFICIAL_STYLE',
    "calculatorAppropriate" BOOLEAN NOT NULL DEFAULT false,
    "timeRecommendationSec" INTEGER,
    "isDiagnostic" BOOLEAN NOT NULL DEFAULT false,
    "format" TEXT NOT NULL DEFAULT 'MCQ',
    "stimulus" TEXT,
    "stem" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "source" TEXT NOT NULL DEFAULT 'question-bank',
    "isBluebook" BOOLEAN NOT NULL DEFAULT false,
    "requiresCalculator" BOOLEAN NOT NULL DEFAULT false,
    "desmosRelevant" BOOLEAN NOT NULL DEFAULT false,
    "isRegression" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT NOT NULL DEFAULT 'OK',
    "importConfidence" REAL NOT NULL DEFAULT 1.0,
    "importNotes" TEXT,
    "assets" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Question" ("assets", "correctAnswer", "createdAt", "desmosRelevant", "difficulty", "domain", "explanation", "externalId", "format", "id", "importConfidence", "importNotes", "isBluebook", "isRegression", "questionType", "requiresCalculator", "reviewStatus", "section", "skill", "source", "stem", "stimulus", "updatedAt") SELECT "assets", "correctAnswer", "createdAt", "desmosRelevant", "difficulty", "domain", "explanation", "externalId", "format", "id", "importConfidence", "importNotes", "isBluebook", "isRegression", "questionType", "requiresCalculator", "reviewStatus", "section", "skill", "source", "stem", "stimulus", "updatedAt" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE UNIQUE INDEX "Question_externalId_key" ON "Question"("externalId");
CREATE INDEX "Question_section_idx" ON "Question"("section");
CREATE INDEX "Question_section_skill_idx" ON "Question"("section", "skill");
CREATE INDEX "Question_isDiagnostic_idx" ON "Question"("isDiagnostic");
CREATE INDEX "Question_section_domain_idx" ON "Question"("section", "domain");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
CREATE INDEX "Question_reviewStatus_idx" ON "Question"("reviewStatus");
CREATE TABLE "new_QuestionAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "chosenAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeMs" INTEGER,
    "mode" TEXT NOT NULL DEFAULT 'practice',
    "confidence" TEXT,
    "isReview" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "answerChanges" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "stage" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuestionAttempt" ("chosenAnswer", "confidence", "createdAt", "id", "isCorrect", "isReview", "mode", "questionId", "timeMs", "userId") SELECT "chosenAnswer", "confidence", "createdAt", "id", "isCorrect", "isReview", "mode", "questionId", "timeMs", "userId" FROM "QuestionAttempt";
DROP TABLE "QuestionAttempt";
ALTER TABLE "new_QuestionAttempt" RENAME TO "QuestionAttempt";
CREATE INDEX "QuestionAttempt_userId_idx" ON "QuestionAttempt"("userId");
CREATE INDEX "QuestionAttempt_userId_questionId_idx" ON "QuestionAttempt"("userId", "questionId");
CREATE INDEX "QuestionAttempt_userId_createdAt_idx" ON "QuestionAttempt"("userId", "createdAt");
CREATE INDEX "QuestionAttempt_userId_isCorrect_idx" ON "QuestionAttempt"("userId", "isCorrect");
CREATE INDEX "QuestionAttempt_sessionId_idx" ON "QuestionAttempt"("sessionId");
CREATE TABLE "new_StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "grade" INTEGER,
    "satDateId" TEXT,
    "testDate" TEXT,
    "targetScore" INTEGER,
    "hasTakenOfficial" BOOLEAN NOT NULL DEFAULT false,
    "lastOfficialTotal" INTEGER,
    "hasTakenBluebook" BOOLEAN NOT NULL DEFAULT false,
    "lastTotalScore" INTEGER,
    "lastMathScore" INTEGER,
    "lastRwScore" INTEGER,
    "priorTestType" TEXT,
    "weeklyHours" INTEGER,
    "daysPerWeek" INTEGER,
    "minutesPerDay" INTEGER,
    "availableDays" TEXT,
    "strongerSection" TEXT,
    "weakerSection" TEXT,
    "strugglingTopics" TEXT,
    "studyStyle" TEXT,
    "preferredStudyTimes" TEXT,
    "wantsReminders" BOOLEAN NOT NULL DEFAULT true,
    "dailyGoalQuestions" INTEGER NOT NULL DEFAULT 20,
    "planIntensity" TEXT NOT NULL DEFAULT 'BALANCED',
    "diagnosticChoice" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentProfile" ("availableDays", "createdAt", "diagnosticChoice", "grade", "hasTakenBluebook", "hasTakenOfficial", "id", "lastMathScore", "lastOfficialTotal", "lastRwScore", "lastTotalScore", "onboardingComplete", "planIntensity", "satDateId", "strongerSection", "targetScore", "updatedAt", "userId", "weeklyHours") SELECT "availableDays", "createdAt", "diagnosticChoice", "grade", "hasTakenBluebook", "hasTakenOfficial", "id", "lastMathScore", "lastOfficialTotal", "lastRwScore", "lastTotalScore", "onboardingComplete", "planIntensity", "satDateId", "strongerSection", "targetScore", "updatedAt", "userId", "weeklyHours" FROM "StudentProfile";
DROP TABLE "StudentProfile";
ALTER TABLE "new_StudentProfile" RENAME TO "StudentProfile";
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE TABLE "new_TopicMastery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL NOT NULL DEFAULT 0,
    "prevAccuracy" REAL NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "easyAttempts" INTEGER NOT NULL DEFAULT 0,
    "easyCorrect" INTEGER NOT NULL DEFAULT 0,
    "mediumAttempts" INTEGER NOT NULL DEFAULT 0,
    "mediumCorrect" INTEGER NOT NULL DEFAULT 0,
    "hardAttempts" INTEGER NOT NULL DEFAULT 0,
    "hardCorrect" INTEGER NOT NULL DEFAULT 0,
    "mastery" REAL NOT NULL DEFAULT 0,
    "prevMastery" REAL NOT NULL DEFAULT 0,
    "avgTimeMs" INTEGER,
    "recentJson" TEXT,
    "signal" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TopicMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TopicMastery" ("accuracy", "attempts", "correct", "domain", "id", "lastAttemptAt", "prevAccuracy", "section", "skill", "updatedAt", "userId") SELECT "accuracy", "attempts", "correct", "domain", "id", "lastAttemptAt", "prevAccuracy", "section", "skill", "updatedAt", "userId" FROM "TopicMastery";
DROP TABLE "TopicMastery";
ALTER TABLE "new_TopicMastery" RENAME TO "TopicMastery";
CREATE INDEX "TopicMastery_userId_section_idx" ON "TopicMastery"("userId", "section");
CREATE INDEX "TopicMastery_userId_mastery_idx" ON "TopicMastery"("userId", "mastery");
CREATE UNIQUE INDEX "TopicMastery_userId_section_domain_skill_key" ON "TopicMastery"("userId", "section", "domain", "skill");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DiagnosticSession_userId_status_idx" ON "DiagnosticSession"("userId", "status");

-- CreateIndex
CREATE INDEX "DiagnosticResponse_sessionId_orderIndex_idx" ON "DiagnosticResponse"("sessionId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticResponse_sessionId_questionId_key" ON "DiagnosticResponse"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticResult_sessionId_key" ON "DiagnosticResult"("sessionId");

-- CreateIndex
CREATE INDEX "DiagnosticResult_userId_createdAt_idx" ON "DiagnosticResult"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MistakeDiagnosis_attemptId_key" ON "MistakeDiagnosis"("attemptId");

-- CreateIndex
CREATE INDEX "MistakeDiagnosis_userId_category_idx" ON "MistakeDiagnosis"("userId", "category");

-- CreateIndex
CREATE INDEX "SkillRecommendation_userId_status_priority_idx" ON "SkillRecommendation"("userId", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SkillRecommendation_userId_section_skill_key" ON "SkillRecommendation"("userId", "section", "skill");

-- CreateIndex
CREATE INDEX "StudyPlanDay_userId_date_idx" ON "StudyPlanDay"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlanDay_userId_date_key" ON "StudyPlanDay"("userId", "date");

-- CreateIndex
CREATE INDEX "TutorMessage_userId_threadKey_createdAt_idx" ON "TutorMessage"("userId", "threadKey", "createdAt");
