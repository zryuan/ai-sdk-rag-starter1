import { getSkillsMetaData } from '../skill/tool';
import { SKILLS_DIR } from '../skill/config';
import * as sandbox from '@/lib/sandbox/file';

export interface SkillMetadata {
  name: string;
  description: string;
  path: string;
}

/**
 * 发现所有可用的 skills
 * @param directories 额外搜索目录，默认包含项目 skills 目录
 * @returns skills 元数据列表
 */
export async function discoverSkills(
  directories: string[] = [],
): Promise<SkillMetadata[]> {
  const dirs = [SKILLS_DIR, ...directories];
  return getSkillsMetaData(sandbox, dirs);
}

export function buildSkillsPrompt(skills: SkillMetadata[]): string {
  const skillsList = skills
    .map(s => `- ${s.name}: ${s.description}`)
    .join('\n');

  return `
## Skills

Use the \`loadSkill\` tool to load a skill when the user's request
would benefit from specialized instructions.

Available skills:
${skillsList}
`;
}