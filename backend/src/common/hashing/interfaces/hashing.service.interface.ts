export const IHashingServiceToken = Symbol('IHashingService');

export interface IHashingService {
  hash(password: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
