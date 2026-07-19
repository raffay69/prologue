import z from "zod";

export const classifierSchema = z.object({
    result : z.array(z.object({
        path : z.string(),
        url : z.string()
    }))
})

export const codeGenSchema = z.object({
    scriptPerSequence : z.array(z.string()),
    remotion_code : z.string()
})