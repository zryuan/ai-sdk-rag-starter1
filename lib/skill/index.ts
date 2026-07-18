import * as sandbox from '@/lib/sandbox/file'
import { discoverSkills, buildSkillsPrompt, createLoadSkillTool } from '@/lib/skill/tool'
import { SKILLS_DIR } from '@/lib/skill/config'

let skills: Awaited<ReturnType<typeof discoverSkills>> | null = null;

export const addSkillsPrompt = async () => {
    if (!skills) {
        skills = await discoverSkills(sandbox, [SKILLS_DIR]);
    }
    return buildSkillsPrompt(skills);
};

export const getLoadSkillTool = async () => {
    if (!skills) {
        skills = await discoverSkills(sandbox, [SKILLS_DIR]);
    }
    return createLoadSkillTool(sandbox, skills);
};
