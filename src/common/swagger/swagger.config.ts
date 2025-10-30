import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Codi-It',
      version: '1.0.0',
      description: 'CODI-IT API 명세입니다.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
      {
        url: 'https://codi-it-backend.site',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        // auth/login
        Error400Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: '잘못된 요청입니다.' },
            error: { type: 'string', example: 'Bad Request' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        Error401Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 401 },
            message: { type: 'string', example: '이메일 또는 비밀번호가 올바르지 않습니다.' },
            error: { type: 'string', example: 'Unauthorized' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        Error404Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: '요청한 리소스를 찾을 수 없습니다.' },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        // 로그인 요청
        LoginRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', example: 'buyer@codiit.com' },
            password: { type: 'string', example: 'test1234' },
          },
          required: ['email', 'password'],
        },

        // 로그인 응답
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'abcd1234' },
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'TestUser' },
                type: { type: 'string', enum: ['Buyer', 'Seller'], example: 'Buyer' },
                points: { type: 'integer', example: 1000 },
                image: { type: ['string', 'null'], nullable: true, example: null },
                grade: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'grade_green' },
                    name: { type: 'string', example: 'green' },
                    rate: { type: 'integer', example: 5 },
                    minAmount: { type: 'integer', example: 1000000 },
                  },
                },
              },
            },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
          required: ['user', 'accessToken'],
        },
        // auth/refresh
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
          required: ['accessToken'],
        },
        RefreshError400Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: '잘못된 요청입니다.' },
            error: { type: 'string', example: 'Bad Request' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        RefreshError401Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 401 },
            message: { type: 'string', example: 'Unauthorized' },
            error: { type: 'string', example: 'Unauthorized' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        // auth/logout
        LogoutResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '성공적으로 로그아웃되었습니다.' },
          },
          required: ['message'],
        },
        LogoutError401Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 401 },
            message: { type: 'string', example: '인증이 필요합니다.' },
            error: { type: 'string', example: 'Unauthorized' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        // 유저
        UserRegisterRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: '김유저' },
            email: { type: 'string', format: 'email', example: 'email@example.com' },
            password: { type: 'string', example: 'test1234' },
            type: { type: 'string', enum: ['BUYER', 'SELLER'], example: 'BUYER' },
          },
          required: ['name', 'email', 'password', 'type'],
        },

        // 회원가입 성공 응답
        UserRegisterResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: '김유저' },
            email: { type: 'string', example: 'email@example.com' },
            password: { type: 'string', example: '$2b$10$abc...' },
            type: { type: 'string', enum: ['BUYER', 'SELLER'], example: 'BUYER' },
            points: { type: 'integer', example: 999 },
            createdAt: { type: 'string', format: 'date-time', example: '2025-05-29T06:00:41.976Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-05-29T06:00:41.976Z' },
            grade: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'green' },
                id: { type: 'string', example: 'grade_green' },
                rate: { type: 'integer', example: 5 },
                minAmount: { type: 'integer', example: 1000000 },
              },
            },
            image: { type: 'string', example: 'https://s3-url/user_default.png' },
          },
          required: [
            'id',
            'name',
            'email',
            'password',
            'type',
            'points',
            'createdAt',
            'updatedAt',
            'grade',
            'image',
          ],
        },

        // 이미 존재하는 유저 에러
        Error409Response: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '이미 존재하는 유저입니다.' },
            statusCode: { type: 'integer', example: 409 },
            error: { type: 'string', example: 'Conflict' },
          },
          required: ['message', 'statusCode', 'error'],
        },
        // 내 정보 조회 응답
        UserMeResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: '김유저' },
            email: { type: 'string', example: 'email@example.com' },
            password: { type: 'string', example: '$2b$10$abc...' },
            type: { type: 'string', enum: ['BUYER', 'SELLER'], example: 'BUYER' },
            points: { type: 'integer', example: 999 },
            createdAt: { type: 'string', format: 'date-time', example: '2025-05-29T06:00:41.976Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-05-29T06:00:41.976Z' },
            grade: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'green' },
                id: { type: 'string', example: 'grade_green' },
                rate: { type: 'integer', example: 5 },
                minAmount: { type: 'integer', example: 1000000 },
              },
            },
            image: { type: 'string', example: 'https://s3-url/user_default.png' },
          },
          required: [
            'id',
            'name',
            'email',
            'password',
            'type',
            'points',
            'createdAt',
            'updatedAt',
            'grade',
            'image',
          ],
        },

        // 유저 정보 없음
        UsersMeError404Response: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '유저를 찾을 수 없습니다.' },
            statusCode: { type: 'integer', example: 404 },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['message', 'statusCode', 'error'],
        },
        // 유저 정보 수정
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: '김유저', description: '이름' },
            password: { type: 'string', example: 'newPassword123', description: '변경할 비밀번호' },
            currentPassword: {
              type: 'string',
              example: 'currentPassword123',
              description: '현재 비밀번호',
            },
            image: { type: 'string' },
          },
          required: ['currentPassword'],
        },

        // 유저 정보 없음 에러
        UsersUpdateError404Response: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '유저를 찾을 수 없습니다.' },
            statusCode: { type: 'integer', example: 404 },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['message', 'statusCode', 'error'],
        },
        // 관심스토어 조회
        FavoriteStoreItem: {
          type: 'object',
          properties: {
            storeId: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            store: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'CUID' },
                name: { type: 'string', example: 'CODI-IT' },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-06-01T12:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-06-01T13:00:00.000Z',
                },
                userId: { type: 'string', example: 'CUID' },
                address: { type: 'string', example: '서울특별시 강남구 테헤란로 123' },
                detailAddress: { type: 'string', example: '1동 1106호' },
                phoneNumber: { type: 'string', example: '010-1234-5678' },
                content: { type: 'string', example: '저희는 CODI-IT 입니다.' },
                image: { type: 'string', example: 'https://example.com/image.jpg' },
              },
              required: ['id', 'name', 'createdAt', 'updatedAt', 'userId'],
            },
          },
          required: ['storeId', 'userId', 'store'],
        },

        UsersFavoriteStoreError404Response: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '유저를 찾을 수 없습니다.' },
            statusCode: { type: 'integer', example: 404 },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['message', 'statusCode', 'error'],
        },
        // 회원탈퇴
        UserDeleteError400Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: '잘못된 요청입니다.' },
            error: { type: 'string', example: 'Bad Request' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        UserDeleteError401Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 401 },
            message: { type: 'string', example: '인증이 필요합니다.' },
            error: { type: 'string', example: 'Unauthorized' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        UserDeleteError404Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: '유저를 찾을 수 없습니다.' },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        // 상품등록
        ProductRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '상품 이름' },
            price: { type: 'number', description: '정가' },
            content: { type: 'string', description: '제품 상세 정보' },
            image: { type: 'string', description: 'image url' },
            discountRate: { type: 'number', description: '할인율' },
            discountStartTime: { type: 'string', description: '할인 시작 날짜' },
            discountEndTime: { type: 'string', description: '할인 종료 날짜' },
            categoryName: { type: 'string', description: '카테고리 이름' },
            stocks: {
              type: 'array',
              description: '사이즈 별 재고',
              items: {
                type: 'object',
                properties: {
                  size: { type: 'string' },
                  quantity: { type: 'number' },
                },
              },
            },
          },
          required: ['name', 'price', 'categoryName', 'stocks'],
        },
        ProductResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            discountPrice: { type: 'number' },
            discountRate: { type: 'number' },
            discountStartTime: { type: 'string' },
            discountEndTime: { type: 'string' },
            image: { type: 'string' },
            content: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            storeId: { type: 'string' },
            storeName: { type: 'string' },
            category: {
              type: 'array',
              items: {
                type: 'object',
                properties: { id: { type: 'string' }, name: { type: 'string' } },
              },
            },
            stocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  size: { type: 'string' },
                  quantity: { type: 'number' },
                },
              },
            },
          },
        },
        // 400: 이미 상품이 존재하거나 잘못된 요청
        ProductError400Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: '이미 상품이 존재합니다.' },
            error: { type: 'string', example: 'Bad Request' },
          },
          required: ['statusCode', 'message', 'error'],
        },

        // 404: 스토어 또는 카테고리를 찾을 수 없음
        ProductError404Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: '스토어 또는 카테고리를 찾을 수 없습니다.' },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        // 상품목록조회
        ProductListItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            storeId: { type: 'string', example: 'CUID' },
            storeName: { type: 'string', example: '무신사' },
            name: { type: 'string', example: '가디건' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
            price: { type: 'number', example: 20000 },
            discountPrice: { type: 'number', example: 18000 },
            discountRate: { type: 'number', example: 10 },
            discountStartTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-01T00:00:00Z',
            },
            discountEndTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-10T00:00:00Z',
            },
            reviewsCount: { type: 'integer', example: 5 },
            reviewsRating: { type: 'number', example: 4.5 },
            createdAt: { type: 'string', format: 'date-time', example: '2025-06-01T12:00:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-06-02T12:00:00Z' },
            sales: { type: 'integer', example: 30 },
            isSoldOut: { type: 'boolean', example: true },
          },
        },

        // 상품 리스트 응답
        ProductListResponse: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductListItem' },
            },
            totalCount: { type: 'integer', example: 340 },
          },
          required: ['list', 'totalCount'],
        },

        ProductListError404Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: '상품을 찾을 수 없습니다.' },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        Size: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'L' },
          },
        },

        // 🔹 재고 정보
        Stock: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            productId: { type: 'string', example: 'CUID' },
            quantity: { type: 'integer', example: 3 },
            size: { $ref: '#/components/schemas/Size' },
          },
        },

        // 🔹 카테고리 정보
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: 'bottom' },
          },
        },

        // 🔹 리뷰 통계
        ReviewSummary: {
          type: 'object',
          properties: {
            rate1Length: { type: 'integer', example: 0 },
            rate2Length: { type: 'integer', example: 0 },
            rate3Length: { type: 'integer', example: 0 },
            rate4Length: { type: 'integer', example: 0 },
            rate5Length: { type: 'integer', example: 0 },
            sumScore: { type: 'integer', example: 0 },
          },
        },

        // 🔹 문의 답변
        InquiryReply: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            content: { type: 'string', example: '이 제품은 재입고 예정입니다.' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'abc123' },
                name: { type: 'string', example: '홍길동' },
              },
            },
          },
        },

        // 🔹 문의
        Inquiry: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            title: { type: 'string', example: '상품 문의' },
            content: { type: 'string', example: '문의 내용입니다.' },
            status: { type: 'string', example: 'CompletedAnswer' },
            isSecret: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            reply: { $ref: '#/components/schemas/InquiryReply' },
          },
        },

        // 🔹 상품 수정 응답
        ProductUpdateDetailResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: '가디건' },
            image: { type: 'string', example: 'https://s3-URL' },
            content: { type: 'string', example: '상품 상세 설명' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-06-01T00:00:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-06-02T00:00:00Z' },
            reviewsRating: { type: 'number', example: 4.5 },
            storeId: { type: 'string', example: 'CUID' },
            storeName: { type: 'string', example: '하이버' },
            price: { type: 'number', example: 20000 },
            discountPrice: { type: 'number', example: 18000 },
            discountRate: { type: 'number', example: 10 },
            discountStartTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-28T12:34:56Z',
            },
            discountEndTime: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-30T12:34:56Z',
            },
            reviewsCount: { type: 'integer', example: 32 },
            reviews: { type: 'array', items: { $ref: '#/components/schemas/ReviewSummary' } },
            inquiries: { type: 'array', items: { $ref: '#/components/schemas/Inquiry' } },
            category: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            stocks: { type: 'array', items: { $ref: '#/components/schemas/Stock' } },
          },
        },

        // 🔹 공통 에러
        ProductUpdateDetailError404Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: '상품을 찾을 수 없습니다.' },
            error: { type: 'string', example: 'Not Found' },
          },
        },
        // 상품삭제
        ProductDeleteError403Response: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 403 },
            message: { type: 'string', example: '상품 삭제 권한이 없습니다.' },
            error: { type: 'string', example: 'Forbidden' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        // 문의 등록
        CreateInquiryRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', example: '상품 문의합니다.' },
            content: { type: 'string', example: '문의 내용입니다.' },
            isSecret: { type: 'boolean', example: false },
          },
          required: ['title', 'content', 'isSecret'],
        },
        InquiryResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            productId: { type: 'string', example: 'CUID' },
            title: { type: 'string', example: '상품 문의' },
            content: { type: 'string', example: '문의 내용입니다.' },
            status: { type: 'string', example: 'CompletedAnswer' },
            isSecret: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
          },
          required: [
            'id',
            'userId',
            'productId',
            'title',
            'content',
            'status',
            'isSecret',
            'createdAt',
            'updatedAt',
          ],
        },
        // 문의 조회
        InquiryWithUserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            productId: { type: 'string', example: 'CUID' },
            title: { type: 'string', example: '상품 문의' },
            content: { type: 'string', example: '문의 내용입니다.' },
            status: { type: 'string', example: 'CompletedAnswer' },
            isSecret: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            user: {
              type: 'object',
              properties: {
                name: { type: 'string', example: '김유저' },
              },
            },
            reply: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', example: 'CUID' },
                content: { type: 'string', example: '이 제품은 재입고 예정입니다.' },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-06-01T12:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-06-01T12:00:00.000Z',
                },
                user: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: '김유저' },
                  },
                },
              },
            },
          },
          required: [
            'id',
            'userId',
            'productId',
            'title',
            'content',
            'status',
            'isSecret',
            'createdAt',
            'updatedAt',
            'user',
          ],
        },
        // 스토어 api
        StoreCreateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'CODI-IT', description: '이름' },
            address: {
              type: 'string',
              example: '서울특별시 강남구 테헤란로 123',
              description: '주소',
            },
            detailAddress: { type: 'string', example: '1동 1106호', description: '상세 주소' },
            phoneNumber: { type: 'string', example: '010-1234-5678', description: '전화번호' },
            content: { type: 'string', example: '저희는 CODI-IT 입니다.', description: '내용' },
            image: {
              type: 'string',
              example: 'https://example.com/image.jpg',
              description: '이미지 URL 또는 경로',
            },
          },
          required: ['name', 'address', 'detailAddress', 'phoneNumber', 'content'],
        },

        StoreResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: 'CODI-IT' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-06-01T13:00:00.000Z' },
            userId: { type: 'string', example: 'CUID' },
            address: { type: 'string', example: '서울특별시 강남구 테헤란로 123' },
            detailAddress: { type: 'string', example: '1동 1106호' },
            phoneNumber: { type: 'string', example: '010-1234-5678' },
            content: { type: 'string', example: '저희는 CODI-IT 입니다.' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
          },
          required: [
            'id',
            'name',
            'createdAt',
            'updatedAt',
            'userId',
            'address',
            'detailAddress',
            'phoneNumber',
          ],
        },
        // 스토어 수정
        // 스토어 등록/수정 요청
        StoreRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'CODI-IT' },
            address: { type: 'string', example: '서울특별시 강남구 테헤란로 123' },
            detailAddress: { type: 'string', example: '1동 1106호' },
            phoneNumber: { type: 'string', example: '010-1234-5678' },
            content: { type: 'string', example: '저희는 CODI-IT 입니다.' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
          },
          required: ['name', 'address', 'detailAddress', 'phoneNumber', 'content'],
        },

        // 스토어 업데이트 요청 (PATCH)
        StoreUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'CODI-IT' },
            address: { type: 'string', example: '서울특별시 강남구 테헤란로 123' },
            detailAddress: { type: 'string', example: '1동 1106호' },
            phoneNumber: { type: 'string', example: '010-1234-5678' },
            content: { type: 'string', example: '저희는 CODI-IT 입니다.' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
          },
          required: [], // PATCH는 선택적
        },

        // 스토어 응답
        UpdateStoreResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: 'CODI-IT' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-06-01T13:00:00.000Z' },
            userId: { type: 'string', example: 'CUID' },
            address: { type: 'string', example: '서울특별시 강남구 테헤란로 123' },
            detailAddress: { type: 'string', example: '1동 1106호' },
            phoneNumber: { type: 'string', example: '010-1234-5678' },
            content: { type: 'string', example: '저희는 CODI-IT 입니다.' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
          },
          required: [
            'id',
            'name',
            'createdAt',
            'updatedAt',
            'userId',
            'address',
            'detailAddress',
            'phoneNumber',
            'content',
          ],
        },
        // 스토어 상세조회
        // 기존 StoreResponse를 확장
        StoreDetailResponse: {
          allOf: [
            { $ref: '#/components/schemas/UpdateStoreResponse' },
            {
              type: 'object',
              properties: {
                favoriteCount: { type: 'integer', example: 4382 },
              },
              required: ['favoriteCount'],
            },
          ],
        },
        // 내스토어 상세조회
        MyStoreDetailResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            name: { type: 'string', example: 'CODI-IT' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-06-01T13:00:00.000Z' },
            userId: { type: 'string', example: 'CUID' },
            address: { type: 'string', example: '서울특별시 강남구 테헤란로 123' },
            detailAddress: { type: 'string', example: '1동 1106호' },
            phoneNumber: { type: 'string', example: '010-1234-5678' },
            content: { type: 'string', example: '저희는 CODI-IT 입니다.' },
            image: { type: 'string', example: 'https://example.com/image.jpg' },
            productCount: { type: 'integer', example: 32 },
            favoriteCount: { type: 'integer', example: 4382 },
            monthFavoriteCount: { type: 'integer', example: 300 },
            totalSoldCount: { type: 'integer', example: 5000 },
          },
          required: [
            'id',
            'name',
            'createdAt',
            'updatedAt',
            'userId',
            'address',
            'detailAddress',
            'phoneNumber',
            'content',
            'image',
            'productCount',
            'favoriteCount',
            'monthFavoriteCount',
            'totalSoldCount',
          ],
        },
        // 내 스토어 등록 상품 조회
        StoreProductListResponse: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'CUID' },
                  image: { type: 'string', example: 'https://example.com/image.jpg' },
                  name: { type: 'string', example: '가디건' },
                  price: { type: 'number', example: 29900 },
                  stock: { type: 'integer', example: 10 },
                  isDiscount: { type: 'boolean', example: true },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-10-29T23:58:48.439Z',
                  },
                  isSoldOut: { type: 'boolean', example: false },
                },
                required: [
                  'id',
                  'image',
                  'name',
                  'price',
                  'stock',
                  'isDiscount',
                  'createdAt',
                  'isSoldOut',
                ],
              },
            },
            totalCount: { type: 'integer', example: 32 },
          },
          required: ['list', 'totalCount'],
        },
        // 관심스토어 등록
        FavoriteStoreRegisterResponse: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'register', description: '등록 타입' },
            store: { $ref: '#/components/schemas/UpdateStoreResponse' },
          },
          required: ['type', 'store'],
        },
        // 관심스토어 해제
        FavoriteStoreUnregisterResponse: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'unregister', description: '해제 타입' },
            store: { $ref: '#/components/schemas/UpdateStoreResponse' },
          },
          required: ['type', 'store'],
        },
        // 문의
        Store: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cmbt09ahe0016u4r821cfmgum' },
            name: { type: 'string', example: '브랜디' },
          },
          required: ['id', 'name'],
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cmbt09akw00a6u4r8wrl3htvy' },
            name: { type: 'string', example: '편안한 조거 팬츠' },
            image: { type: 'string', example: 'http://s3Url' },
            store: { $ref: '#/components/schemas/Store' },
          },
          required: ['id', 'name', 'image', 'store'],
        },
        User: {
          type: 'object',
          properties: {
            name: { type: 'string', example: '김유저' },
          },
          required: ['name'],
        },
        MyInquiryItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cmbt09aqd00qwu4r84czhy7j9' },
            title: { type: 'string', example: '사이즈 추천 부탁드려요' },
            isSecret: { type: 'boolean', example: true },
            status: { type: 'string', example: 'CompletedAnswer' },
            content: { type: 'string', example: '내용' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-10-29T23:58:48.870Z' },
            product: { $ref: '#/components/schemas/Product' },
            user: { $ref: '#/components/schemas/User' },
          },
          required: [
            'id',
            'title',
            'isSecret',
            'status',
            'product',
            'user',
            'createdAt',
            'content',
          ],
        },
        // 문의 상세조회
        Reply: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            content: { type: 'string', example: '이 제품은 재입고 예정입니다.' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            user: { $ref: '#/components/schemas/User' },
          },
          required: ['id', 'content', 'createdAt', 'updatedAt', 'user'],
        },
        InquiryDetail: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            productId: { type: 'string', example: 'CUID' },
            title: { type: 'string', example: '상품 문의' },
            content: { type: 'string', example: '문의 내용입니다.' },
            status: { type: 'string', example: 'CompletedAnswer' },
            isSecret: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            user: { $ref: '#/components/schemas/User' },
            reply: { $ref: '#/components/schemas/Reply' },
          },
          required: [
            'id',
            'userId',
            'productId',
            'title',
            'content',
            'status',
            'isSecret',
            'createdAt',
            'updatedAt',
            'user',
          ],
        },
        // 문의 수정
        UpdateInquiryRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', example: '상품 문의합니다.' },
            content: { type: 'string', example: '문의 내용입니다.' },
            isSecret: { type: 'boolean', example: false },
          },
          required: ['title', 'content', 'isSecret'],
        },
        UpdateInquiryResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            productId: { type: 'string', example: 'CUID' },
            title: { type: 'string', example: '상품 문의' },
            content: { type: 'string', example: '문의 내용입니다.' },
            status: { type: 'string', example: 'CompletedAnswer' },
            isSecret: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2023-10-01T00:00:00.000Z' },
          },
          required: [
            'id',
            'userId',
            'productId',
            'title',
            'content',
            'status',
            'isSecret',
            'createdAt',
            'updatedAt',
          ],
        },
        // 문의 답변
        CreateInquiryReplyRequest: {
          type: 'object',
          properties: {
            content: { type: 'string', example: '답변 내용입니다.' },
          },
          required: ['content'],
        },

        CreateInquiryReplyResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            inquiryId: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            content: { type: 'string', example: '이 제품은 재입고 예정입니다.' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user@codiit.com' },
                name: { type: 'string', example: '홍길동' },
              },
              required: ['id', 'name'],
            },
          },
          required: ['id', 'inquiryId', 'userId', 'content', 'createdAt', 'updatedAt', 'user'],
        },
        // 문의답변수정
        UpdateInquiryReplyRequest: {
          type: 'object',
          properties: {
            content: { type: 'string', example: '답변 내용입니다.' },
          },
          required: ['content'],
        },
        UpdateInquiryReplyResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CUID' },
            inquiryId: { type: 'string', example: 'CUID' },
            userId: { type: 'string', example: 'CUID' },
            content: { type: 'string', example: '이 제품은 재입고 예정입니다.' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user@codiit.com' },
                name: { type: 'string', example: '홍길동' },
              },
              required: ['id', 'name'],
            },
          },
          required: ['id', 'inquiryId', 'userId', 'content', 'createdAt', 'updatedAt', 'user'],
        },
        // 대쉬보드조회
        DashboardResponse: {
          type: 'object',
          properties: {
            today: { $ref: '#/components/schemas/TimePeriodStats' },
            week: { $ref: '#/components/schemas/TimePeriodStats' },
            month: { $ref: '#/components/schemas/TimePeriodStats' },
            year: { $ref: '#/components/schemas/TimePeriodStats' },
            topSales: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  totalOrders: { type: 'integer', example: 215 },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'product-cuid' },
                      name: { type: 'string', example: '스웨터' },
                      price: { type: 'integer', example: 30000 },
                    },
                    required: ['id', 'name', 'price'],
                  },
                },
                required: ['totalOrders', 'product'],
              },
            },
            priceRange: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priceRange: { type: 'string', example: '만원 이하' },
                  totalSales: { type: 'integer', example: 3505000 },
                  percentage: { type: 'number', example: 35.6 },
                },
                required: ['priceRange', 'totalSales', 'percentage'],
              },
            },
          },
          required: ['today', 'week', 'month', 'year', 'topSales', 'priceRange'],
        },

        TimePeriodStats: {
          type: 'object',
          properties: {
            current: {
              type: 'object',
              properties: {
                totalOrders: { type: 'integer', example: 38 },
                totalSales: { type: 'integer', example: 15000000 },
              },
              required: ['totalOrders', 'totalSales'],
            },
            previous: {
              type: 'object',
              properties: {
                totalOrders: { type: 'integer', example: 38 },
                totalSales: { type: 'integer', example: 15000000 },
              },
              required: ['totalOrders', 'totalSales'],
            },
            changeRate: {
              type: 'object',
              properties: {
                totalOrders: { type: 'integer', example: 23 },
                totalSales: { type: 'integer', example: 20 },
              },
              required: ['totalOrders', 'totalSales'],
            },
          },
          required: ['current', 'previous', 'changeRate'],
        },
        // notification
        Alarm: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'alarm_123' },
            userId: { type: 'string', example: 'user_456' },
            content: { type: 'string', example: '상품이 품절되었습니다.' },
            isChecked: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2025-06-03T12:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-06-03T12:00:00.000Z' },
          },
          required: ['id', 'userId', 'content', 'isChecked', 'createdAt', 'updatedAt'],
        },
        // notification error
        Error400: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: '잘못된 요청입니다.' },
            error: { type: 'string', example: 'Bad Request' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        Error401: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 401 },
            message: { type: 'string', example: '인증이 필요합니다.' },
            error: { type: 'string', example: 'Unauthorized' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        Error403: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 403 },
            message: { type: 'string', example: '접근 권한이 없습니다.' },
            error: { type: 'string', example: 'Forbidden' },
          },
          required: ['statusCode', 'message', 'error'],
        },
        Error404: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: '요청한 리소스를 찾을 수 없습니다.' },
            error: { type: 'string', example: 'Not Found' },
          },
          required: ['statusCode', 'message', 'error'],
        },
      },
    },
  },
  // Swagger가 스캔할 파일 경로 (라우터, DTO 등)
  apis: [
    'src/users/*.ts',
    'src/auth/*.ts',
    'src/product/*.ts',
    'src/stores/*.ts',
    'src/**/dtos/*.ts',
    'src/inquiry/*.ts',
    'src/dashboard/*.ts',
    'src/notification/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
