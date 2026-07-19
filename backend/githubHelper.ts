import axios from "axios"
import { classifierCall } from "./ai"
import type { Response } from "express"
import { remove_these } from "./utils"


async function githubTreeFetcher(url:string){
    const owner = url.split("/").at(-2)
    const repoName = url.split("/").at(-1)
    // use the repoName as the title in the sidebar (frontend)
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1` , {
        headers : {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
        }
    })
    const data = res.data

    const filtered = data.tree.filter((el : {type : string})=> el.type !== "tree" )

    const moreFilter = filtered.filter((el : { path : string })=> !remove_these.includes(el.path.split("/").at(-1)!))
    
    const formattedResult = moreFilter.map((el : {path : string , url : string})=> ({ path : el.path , url : el.url}))
    
    const readme = formattedResult.filter((el : {path : string })=> el.path.toLowerCase() === "readme.md" )

    return { formattedResult , readme }
}


async function codePopulater(arr : {path:string , url : string}[]){
    const result = []
    for(let el of arr){
        const res = await axios.get(el.url , {
            headers : {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json",
            }
        })
        const decoded = Buffer.from(res.data.content, "base64").toString("utf8");
        result.push({path : el.path , content : decoded})
    }
    return result
}


export async function githubFetcher(url:string , res : Response) {
    res.write(`event:progress\ndata:${JSON.stringify("Fetching repository files")}\n\n`);
    const { formattedResult , readme } = await githubTreeFetcher(url)
    
    res.write(`event:progress\ndata:${JSON.stringify("Identifying UI components")}\n\n`);
    const LLMresult = await classifierCall(formattedResult)

    res.write(`event:progress\ndata:${JSON.stringify("Extracting component code")}\n\n`);
    const populated = await codePopulater(LLMresult)
    
    let readmeContent
    if(readme.length > 0){
        res.write(`event:progress\ndata:${JSON.stringify("Reading project README")}\n\n`);
        const result = await codePopulater(readme)
        readmeContent = result[0]?.content
    } else {
        readmeContent = "Readme not provided"
    }
    
    res.write(`event:progress\ndata:${JSON.stringify("Finalizing results")}\n\n`);
    const finalOutput = JSON.stringify({uiElements : populated , readme : readmeContent})
    return finalOutput
}