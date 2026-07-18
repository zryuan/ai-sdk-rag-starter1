import yaml from 'yaml'
import { Dirent } from 'node:fs';
import { tool } from 'ai'
import { z } from 'zod'
interface Sandbox {
  readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
  readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<string[] | Dirent[]>;
}

interface SkillMetadata {
  name: string;
  description: string;
  path: string;
}


function parseFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) throw new Error('No frontmatter found');
  return yaml.parse(match[1]);
}

export async function discoverSkills(
  sb: Sandbox,
  directories: string[],
): Promise<SkillMetadata[]> {
  const skills: SkillMetadata[] = [];
  const seenNames = new Set<string>();

  for (const dir of directories) {
    let entries: Dirent[];
    try {
      entries = await sb.readdir(dir, { withFileTypes: true }) as Dirent[];
    } catch {
      continue; // Skip directories that don't exist
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = `${dir}/${entry.name}`;
      const skillFile = `${skillDir}/SKILL.md`;

      try {
        const content = await sb.readFile(skillFile, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        // First skill with a given name wins (allows project overrides)
        if (seenNames.has(frontmatter.name)) continue;
        seenNames.add(frontmatter.name);

        skills.push({
          name: frontmatter.name,
          description: frontmatter.description,
          path: skillDir,
        });
      } catch {
        continue; // Skip skills without valid SKILL.md
      }
    }
  }
  return skills;
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

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? content.slice(match[0].length).trim() : content.trim();
}

export function createLoadSkillTool(sb: Sandbox, skills: SkillMetadata[]) {
  return tool({
    description: 'Load a skill to get specialized instructions',
    inputSchema: z.object({
      name: z.string().describe('The skill name to load'),
    }),
    execute: async ({ name }) => {
      const skill = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (!skill) {
        return { error: `Skill '${name}' not found` };
      }

      const skillFile = `${skill.path}/SKILL.md`;
      const content = await sb.readFile(skillFile, 'utf-8');
      const body = stripFrontmatter(content);

      return {
        skillDirectory: skill.path,
        content: body,
      };
    },
  });
}