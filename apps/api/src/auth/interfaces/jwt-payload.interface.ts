export interface JwtPayload {
  sub: string
  email: string
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
}

export interface JwtRefreshPayload extends JwtPayload {
  tokenId: string
}
