import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
import * as bcrypt from 'bcryptjs';

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@school.ac.th',
      password: '$2a$10$hashedpassword',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      role: Role.STUDENT,
    };

    it('should return user without password when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@school.ac.th', 'password123');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result!.email).toBe('test@school.ac.th');
      expect(result!.firstName).toBe('สมชาย');
    });

    it('should return null when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@school.ac.th', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@school.ac.th', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await service.validateUser('TEST@School.AC.TH', 'password');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@school.ac.th');
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@school.ac.th',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      role: Role.STUDENT,
    };

    it('should return access_token and user info', async () => {
      const result = await service.login(mockUser);

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@school.ac.th',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        role: Role.STUDENT,
      });
    });

    it('should sign JWT with correct payload', async () => {
      await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@school.ac.th',
        sub: 'user-1',
        role: Role.STUDENT,
      });
    });

    it('should not include password in user response', async () => {
      const result = await service.login(mockUser);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('getProfile', () => {
    it('should call usersService.findById with correct id', async () => {
      const mockProfile = { id: 'user-1', email: 'test@school.ac.th' };
      mockUsersService.findById.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-1');

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockProfile);
    });
  });
});
