import { exec as cpExec } from 'node:child_process';
import { resolve } from 'node:path';

export interface ExecOptions {
  /** 工作目录 */
  cwd?: string;
  /** 超时时间 (ms)，默认 30000 */
  timeout?: number;
  /** 环境变量 */
  env?: Record<string, string>;
}

export interface ExecResult {
  /** 标准输出 */
  stdout: string;
  /** 标准错误 */
  stderr: string;
  /** 退出码 */
  exitCode: number;
  /** 是否被信号终止 */
  killed: boolean;
}

/**
 * 在沙箱中执行 Shell 命令
 * @param command 要执行的命令
 * @param options 执行选项
 * @returns 执行结果
 */
export function exec(
  command: string,
  options: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolvePromise, reject) => {
    const {
      cwd: userCwd,
      timeout = 30000,
      env: extraEnv,
    } = options;

    const cwd = userCwd ? resolve(userCwd) : resolve('.');

    const child = cpExec(
      command,
      {
        cwd,
        timeout,
        env: extraEnv ? { ...process.env, ...extraEnv } : undefined,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error && (error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
          reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
          return;
        }
        resolvePromise({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: error?.code ?? 0,
          killed: error?.killed ?? false,
        });
      },
    );

    // 将 child 对象暴露给 on('spawn') 等自定义处理
    Object.defineProperty(resolvePromise, 'child', {
      value: child,
      writable: false,
    });
  });
}
