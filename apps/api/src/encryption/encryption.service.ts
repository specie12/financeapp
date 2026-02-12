import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class EncryptionService {
  private readonly key: Buffer

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('plaid.encryptionKey') || ''
    // Derive a 32-byte key from the configured key
    if (encryptionKey.length >= 32) {
      this.key = Buffer.from(encryptionKey.slice(0, 32), 'utf-8')
    } else {
      // Pad to 32 bytes if shorter
      this.key = Buffer.from(encryptionKey.padEnd(32, '0'), 'utf-8')
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encrypted (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }

    const iv = Buffer.from(parts[0]!, 'base64')
    const authTag = Buffer.from(parts[1]!, 'base64')
    const encrypted = Buffer.from(parts[2]!, 'base64')

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8')
  }
}
