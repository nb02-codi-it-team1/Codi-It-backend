declare namespace Express {
  // Request 인터페이스에 user 속성을 추가합니다.
  interface Request {
    user?: {
      id: string;
      email: string;
      type: 'SELLER' | 'BUYER';
    };

    file?: Express.MulterS3.File;
  }
}
