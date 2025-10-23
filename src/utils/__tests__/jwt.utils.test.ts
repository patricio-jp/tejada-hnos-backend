import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { JwtUtils } from '../jwt.utils';
import { TokenPayload } from '../../interfaces/auth.interface';
import { UserRole } from '../../enums';

describe('JwtUtils', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    name: 'Test',
    lastName: 'User',
  };

  beforeEach(() => {
    // Reset environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '12h';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = JwtUtils.generateAccessToken(mockPayload);
      const token2 = JwtUtils.generateAccessToken({
        ...mockPayload,
        userId: 'different-user-id',
      });
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JwtUtils.generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = JwtUtils.generateRefreshToken(mockPayload);
      const token2 = JwtUtils.generateRefreshToken({
        ...mockPayload,
        userId: 'different-user-id',
      });

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens from access token', () => {
      const accessToken = JwtUtils.generateAccessToken(mockPayload);
      const refreshToken = JwtUtils.generateRefreshToken(mockPayload);
      
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      const decoded = JwtUtils.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.name).toBe(mockPayload.name);
      expect(decoded.lastName).toBe(mockPayload.lastName);
    });

    it('should throw error for expired token', () => {
      // Generate a token that expires immediately
      process.env.JWT_EXPIRES_IN = '1ms';
      const token = JwtUtils.generateAccessToken(mockPayload);
      
      // Wait for token to expire
      return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
        expect(() => {
          JwtUtils.verifyAccessToken(token);
        }).toThrow('Token de acceso inválido o expirado');
      });
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JwtUtils.verifyAccessToken('invalid-token');
      }).toThrow('Token de acceso inválido o expirado');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = JwtUtils.generateRefreshToken(mockPayload);
      const decoded = JwtUtils.verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw error for expired refresh token', () => {
      // Generate a token that expires immediately
      process.env.JWT_REFRESH_EXPIRES_IN = '1ms';
      const token = JwtUtils.generateRefreshToken(mockPayload);

      // Wait for token to expire
      return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
        expect(() => {
          JwtUtils.verifyRefreshToken(token);
        }).toThrow('Refresh token inválido o expirado');
      });
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        JwtUtils.verifyRefreshToken('invalid-token');
      }).toThrow('Refresh token inválido o expirado');
    });

    it('should not verify access token as refresh token', () => {
      const accessToken = JwtUtils.generateAccessToken(mockPayload);
      
      expect(() => {
        JwtUtils.verifyRefreshToken(accessToken);
      }).toThrow('Refresh token inválido o expirado');
    });
  });

  describe('decode', () => {
    it('should decode a valid token without verifying', () => {
      const token = JwtUtils.generateAccessToken(mockPayload);
      const decoded = JwtUtils.decode(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(mockPayload.userId);
      expect(decoded!.email).toBe(mockPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = JwtUtils.decode('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
