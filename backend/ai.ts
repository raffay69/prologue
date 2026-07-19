import { ChatOpenRouter } from "@langchain/openrouter";
import { classifierPrompt, codeGeneratorPrompt } from "./prompts";
import { HumanMessage, SystemMessage } from "langchain";
import { classifierSchema, codeGenSchema } from "./outputSchemas";

const model = new ChatOpenRouter({
    apiKey : process.env.LLM_KEY,
    model : "tencent/hy3:free",
    maxRetries : 1
})

export async function classifierCall(arr : {path:string , url : string}[] ){
    const _model = model.withStructuredOutput(classifierSchema)
    const data = await _model.invoke([new SystemMessage(classifierPrompt) , new HumanMessage(JSON.stringify(arr))])
    const result = data.result
    return result
}

export async function generate(data : string) {
    const _model2 = model.withStructuredOutput(codeGenSchema)
    const res = await _model2.invoke([new SystemMessage(codeGeneratorPrompt) , new HumanMessage(data)])
    return res
}