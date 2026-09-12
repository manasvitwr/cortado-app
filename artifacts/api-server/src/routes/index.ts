import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tutordRouter from "./tutord";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tutordRouter);

export default router;
