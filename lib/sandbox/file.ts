import { readFile as fsReadFile, readdir as fsReaddir } from 'node:fs/promises';
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

/**
 * 读取目录内容
 * @param dirPath 目录路径（相对或绝对）
 * @param options.withFileTypes 是否返回 Dirent 对象，默认 false
 * @returns 文件名数组
 */
export async function readdir(
  dirPath: string,
  options?: { withFileTypes?: boolean },
): Promise<string[]> {
  const absolutePath = resolve(dirPath);
  const { withFileTypes = false } = options ?? {};
  if (withFileTypes) {
    const entries = await fsReaddir(absolutePath, { withFileTypes: true });
    return entries.map((e) => e.name);
  }
  return fsReaddir(absolutePath);
}
