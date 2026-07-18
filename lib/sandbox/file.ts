import { readFile as fsReadFile, readdir as fsReaddir } from 'node:fs/promises';
import { Dirent } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 读取文件内容（UTF-8）
 * @param filePath 文件路径（相对或绝对）
 * @param encoding 编码，默认 utf-8
 * @returns 文件内容字符串
 */
export async function readFile(
  filePath: string,
  encoding: BufferEncoding = 'utf-8',
): Promise<string> {
  const absolutePath = resolve(filePath);
  return fsReadFile(absolutePath, { encoding });
}

export async function readdir(
  dirPath: string,
  options?: { withFileTypes?: boolean },
): Promise<string[]>;
export async function readdir(
  dirPath: string,
  options: { withFileTypes: true },
): Promise<Dirent[]>;
export async function readdir(
  dirPath: string,
  options?: { withFileTypes?: boolean },
): Promise<string[] | Dirent[]> {
  const absolutePath = resolve(dirPath);
  if (options?.withFileTypes) {
    return fsReaddir(absolutePath, { withFileTypes: true });
  }
  return fsReaddir(absolutePath);
}
