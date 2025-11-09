import { Router } from 'express';
import MetadataService from './metadata.service';
import MetadataController from './metadata.controller';

const router = Router();
const controller = new MetadataController(new MetadataService());

/** /api/metadata/grade */
router.get('/grade', controller.getGradeList);

/** /api/metadata/size */
router.get('/size', controller.getSizeList);

/** /api/metadata/category/:name  (all|top|bottom|dress|outer|skirt|shoes|acc) */
router.get('/category/:name', controller.getCategoryList);

export default router;
