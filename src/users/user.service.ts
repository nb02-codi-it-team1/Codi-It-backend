import bcrypt from 'bcrypt';
import { CreateUserDto, UserResponseDto } from './dtos/create-user.dto';
import UserRepository from './user.repository';
import { ConflictError } from '../common/errors/error-type';

export default class UserService {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    // 이메일 중복 검사
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('이미 존재하는 유저입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 유저 생성
    const newUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      type: data.type,
      points: 0,
      grade: { connect: { id: 'grade_green' } },
      image: 'https://example.com/default.png',
    });

    return newUser;
  }
}
