import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshToken } from '../refresh-token.entity.js';
import { User } from '../user.entity.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ id: number; email: string }> {
    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.usersRepository.create({
      email,
      passwordHash: await bcrypt.hash(registerDto.password, 12),
    });

    try {
      const savedUser = await this.usersRepository.save(user);
      return { id: savedUser.id, email: savedUser.email };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    const stored = await this.findUsableRefreshToken(refreshToken);
    const user = await this.usersRepository.findOneBy({ id: stored.userId });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    stored.revokedAt = new Date();
    await this.refreshTokensRepository.save(stored);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const stored = await this.refreshTokensRepository.findOneBy({
      tokenHash: this.hashToken(refreshToken),
    });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshTokensRepository.save(stored);
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const refreshToken = randomBytes(48).toString('base64url');
    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        revokedAt: null,
      }),
    );

    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
      refreshToken,
    };
  }

  private async findUsableRefreshToken(
    refreshToken: string | undefined,
  ): Promise<RefreshToken> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const stored = await this.refreshTokensRepository.findOneBy({
      tokenHash: this.hashToken(refreshToken),
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (stored.revokedAt) {
      await this.refreshTokensRepository.update(
        { userId: stored.userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      stored.revokedAt = new Date();
      await this.refreshTokensRepository.save(stored);
      throw new UnauthorizedException('Invalid credentials');
    }

    return stored;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;
    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === '23505'
    );
  }
}
