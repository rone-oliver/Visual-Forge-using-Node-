export const ITokenRefreshServiceToken = Symbol('ITokenRefreshService');

export interface ITokenRefreshService {
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
  verifyRefreshToken(refreshToken: string): Promise<void>;
}
