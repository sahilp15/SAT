-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "grade" INTEGER,
    "satDateId" TEXT,
    "targetScore" INTEGER,
    "hasTakenOfficial" BOOLEAN NOT NULL DEFAULT false,
    "lastOfficialTotal" INTEGER,
    "hasTakenBluebook" BOOLEAN NOT NULL DEFAULT false,
    "lastTotalScore" INTEGER,
    "lastMathScore" INTEGER,
    "lastRwScore" INTEGER,
    "weeklyHours" INTEGER,
    "availableDays" TEXT,
    "strongerSection" TEXT,
    "planIntensity" TEXT NOT NULL DEFAULT 'BALANCED',
    "diagnosticChoice" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "defaultTimerSecs" INTEGER NOT NULL DEFAULT 75,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "section" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionType" TEXT,
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

-- CreateTable
CREATE TABLE "AnswerChoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "rationaleWrong" TEXT,
    CONSTRAINT "AnswerChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "chosenAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeMs" INTEGER,
    "mode" TEXT NOT NULL DEFAULT 'practice',
    "confidence" TEXT,
    "isReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorLog" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ErrorLog_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuestionAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorLogId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "rubricScores" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiReview_errorLogId_fkey" FOREIGN KEY ("errorLogId") REFERENCES "ErrorLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SrsItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "intervalIndex" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL,
    "lastResult" TEXT,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SrsItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SrsItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "phase" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'rule-based',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlanTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cadence" TEXT NOT NULL DEFAULT 'weekly',
    "forDate" DATETIME,
    "section" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StudyPlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeTestSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testLabel" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FULL',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeTestSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeTestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testLabel" TEXT NOT NULL,
    "takenOn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalScore" INTEGER,
    "mathScore" INTEGER,
    "rwScore" INTEGER,
    "missedCategories" TEXT,
    "notes" TEXT,
    CONSTRAINT "PracticeTestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopicMastery" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TopicMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_externalId_key" ON "Question"("externalId");

-- CreateIndex
CREATE INDEX "Question_section_idx" ON "Question"("section");

-- CreateIndex
CREATE INDEX "Question_section_domain_idx" ON "Question"("section", "domain");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "Question_reviewStatus_idx" ON "Question"("reviewStatus");

-- CreateIndex
CREATE INDEX "AnswerChoice_questionId_idx" ON "AnswerChoice"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerChoice_questionId_label_key" ON "AnswerChoice"("questionId", "label");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_idx" ON "QuestionAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_questionId_idx" ON "QuestionAttempt"("userId", "questionId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_createdAt_idx" ON "QuestionAttempt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorLog_attemptId_key" ON "ErrorLog"("attemptId");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_mistakeType_idx" ON "ErrorLog"("userId", "mistakeType");

-- CreateIndex
CREATE INDEX "AiReview_errorLogId_idx" ON "AiReview"("errorLogId");

-- CreateIndex
CREATE INDEX "SrsItem_userId_dueDate_idx" ON "SrsItem"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "SrsItem_userId_active_idx" ON "SrsItem"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SrsItem_userId_questionId_key" ON "SrsItem"("userId", "questionId");

-- CreateIndex
CREATE INDEX "StudyPlan_userId_active_idx" ON "StudyPlan"("userId", "active");

-- CreateIndex
CREATE INDEX "StudyPlanTask_planId_idx" ON "StudyPlanTask"("planId");

-- CreateIndex
CREATE INDEX "PracticeTestSchedule_userId_scheduledFor_idx" ON "PracticeTestSchedule"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "PracticeTestResult_userId_takenOn_idx" ON "PracticeTestResult"("userId", "takenOn");

-- CreateIndex
CREATE INDEX "TopicMastery_userId_section_idx" ON "TopicMastery"("userId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMastery_userId_section_domain_skill_key" ON "TopicMastery"("userId", "section", "domain", "skill");
