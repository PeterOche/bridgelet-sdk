import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockExecutionContext = (authHeader?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authHeader },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('allows request with a valid Bearer token', async () => {
    jwtService.verifyAsync.mockResolvedValueOnce({ sub: '1' });
    await expect(
      guard.canActivate(mockExecutionContext('Bearer valid.token')),
    ).resolves.toBe(true);
  });

  it('throws 401 when Authorization header is missing', async () => {
    await expect(guard.canActivate(mockExecutionContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws 401 when scheme is not Bearer', async () => {
    await expect(
      guard.canActivate(mockExecutionContext('Basic sometoken')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when token is expired', async () => {
    jwtService.verifyAsync.mockRejectedValueOnce(
      new Error('TokenExpiredError'),
    );
    await expect(
      guard.canActivate(mockExecutionContext('Bearer expired.token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when token signature is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValueOnce(
      new Error('JsonWebTokenError'),
    );
    await expect(
      guard.canActivate(mockExecutionContext('Bearer bad.signature')),
    ).rejects.toThrow(UnauthorizedException);
  });
});
