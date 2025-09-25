import { Request, Response } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError } from '../common/errors/error-type';
import { S3Client } from '@aws-sdk/client-s3';
import {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} from '../common/constants';

// 사용 가능한 파일 타입
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// 파일 사이즈 제한 (5MB)
const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    },
  }),

  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },

  // 파일 타입 검사
  fileFilter: function (req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestError('PNG, JPEG, JPG 형식의 이미지 파일만 업로드할 수 있습니다.'));
    }
    cb(null, true);
  },
});

// 업로드 컨트롤러
export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new BadRequestError('업로드할 파일이 필요합니다.');
  }

  const file = req.file as Express.MulterS3.File;

  res.send({ url: file.location });
}
