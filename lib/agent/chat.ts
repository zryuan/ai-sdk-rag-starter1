import { ToolLoopAgent } from "ai";
import { zhipu } from "@/lib/llms/zhipu";
import { addResourceTool, getInformationTool } from "@/lib/tools/rag";
import { getLoadSkillTool } from "@/lib/skill";
import { addSkillsPrompt } from "@/lib/skill";

export const chatAgent = new ToolLoopAgent({
  model: zhipu('GLM-4.6V'),
  instructions: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
  tools: {
    addResource: addResourceTool,
    getInformation: getInformationTool,
    loadSkill: await getLoadSkillTool(),
  },
  async prepareCall(ctx) {
    const skillsPrompt = await addSkillsPrompt()
    return {
      ...ctx,
      instructions: `${ctx.instructions}\n\n${skillsPrompt}`
    }
  }
});