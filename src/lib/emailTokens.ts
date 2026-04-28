import crypto from 'crypto'

const ALG = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.EMAIL_TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error('EMAIL_TOKEN_ENCRYPTION_KEY not set')
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('EMAIL_TOKEN_ENCRYPTION_KEY must decode to 32 bytes')
  return buf
}

export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALG, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decryptToken(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.')
  const decipher = crypto.createDecipheriv(ALG, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return dec.toString('utf8')
}
