import express from 'express';
import {Calculate} from './Fare.Controllers.js';

const router = express.Router();

router.post('/calculate', Calculate);

export default router;