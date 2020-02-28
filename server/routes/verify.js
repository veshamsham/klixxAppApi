import express from 'express';
import verifyCtrl from '../controllers/verify';

const router = express.Router();

router.route('/email')
  .post(verifyCtrl.emailVerify)
  .put(verifyCtrl.emailVerify)
  .get(verifyCtrl.emailVerify);

// /** GET /api/verify/mobileVerify -  */

router.route('/mobile')
  .get(verifyCtrl.mobileVerify)

  .post(verifyCtrl.mobileVerify);

export default router;
