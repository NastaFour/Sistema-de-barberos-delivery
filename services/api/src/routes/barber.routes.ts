import { Router } from 'express';
import * as barberController from '../controllers/barber.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', barberController.getBarbers);
router.get('/:id', barberController.getBarberById);
router.get('/:id/reviews', barberController.getBarberReviews);
router.put('/:id', authenticate, barberController.updateProfile);
router.post('/:id/services', authenticate, barberController.createService);
router.put('/services/:serviceId', authenticate, barberController.updateService);
router.delete('/services/:serviceId', authenticate, barberController.deleteService);
router.post('/gallery', authenticate, barberController.addToGallery);
router.delete('/gallery/:imageId', authenticate, barberController.removeFromGallery);

export default router;
