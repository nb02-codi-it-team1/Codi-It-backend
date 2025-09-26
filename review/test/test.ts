// review/test/test.ts
import { createReview } from "../review.controller";
//import { mockDeep } from 'jest-mock-extended';
const mockPrisma = {
  review: {
    //create: jest.fn(),
    //findMany: jest.fn(),
  },
};

//describe("Review Service", () => {
  //it("리뷰가 정상적으로 등록된다.", async () => {
    //mockPrisma.review.create.mockResolvedValue({
      //id: 1,
      //productId: 100,
      //rating: 5,
      //content: "좋아요!",
    //});

    //const result = await createReview(mockPrisma, {
      //productId: 100,
      //rating: 5,
      //content: "좋아요!",
    //});

    //expect(result).toHaveProperty("id", 1);
    //expect(mockPrisma.review.create).toHaveBeenCalledTimes(1);
  //});
//});


//const mockPrisma = mockDeep<PrismaClient>();

//describe("리뷰 생성 테스트", () => {
  //it("리뷰를 생성한다", async () => {
    //mockPrisma.review.create.mockResolvedValue({
      //id: 1,
      //productId: 100,
      //rating: 5,
      //content: "좋아요!",
    //});

//mockPrisma.review.create.mockResolvedValue 
({
    id: 1,
    productId: 100,
    rating: 5,
    content: "좋아요!",
})