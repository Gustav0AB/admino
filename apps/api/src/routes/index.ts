import { Router } from "express";
import authRouter from "./auth";
import membersRouter from "./members";
import expensesRouter from "./expenses";
import adminRouter from "./admin";
import clientsRouter from "./clients";
import plansRouter from "./plans";
import memberRolesRouter from "./member-roles";
import notificationsRouter from "./notifications";
import auditLogsRouter from "./audit-logs";
import trainingPlansRouter from "./training-plans";
import workoutChecksRouter from "./workout-checks";
import workoutFeedbackRouter from "./workout-feedback";
import trainingEventsRouter from "./training-events";
import aiRouter from "./ai";

const router = Router();

router.use("/auth", authRouter);
router.use("/members", membersRouter);
router.use("/expenses", expensesRouter);
router.use("/admin", adminRouter);
router.use("/clients", clientsRouter);
router.use("/plans", plansRouter);
router.use("/member-roles", memberRolesRouter);
router.use("/notifications", notificationsRouter);
router.use("/audit-logs", auditLogsRouter);
router.use("/training-plans", trainingPlansRouter);
router.use("/workout-checks", workoutChecksRouter);
router.use("/workout-feedback", workoutFeedbackRouter);
router.use("/training-events", trainingEventsRouter);
router.use("/ai", aiRouter);

export default router;
