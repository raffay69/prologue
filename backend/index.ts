import express from "express"
import cors from "cors"
import { Queue, QueueEvents, type JobProgress } from "bullmq"
import { client } from "./redisClient"
import { githubFetcher } from "./githubHelper"
import { generate } from "./ai"
import { loadingMessages } from "./utils"

const app = express()
const PORT = process.env.PORT || 4000

const queue = new Queue("video_render" , {
    connection : client
})

const queueEvents = new QueueEvents("video_render" , {
    connection : client
})

app.use(cors())
app.use(express.json())


app.post("/video" , async(req ,res)=>{
    const { url } = req.body
    
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // fetch code from repo
    const data = await githubFetcher(url , res)
    // generate code and audio script

    // send fake events
    let i = 0 
    const interval = setInterval(() => {
        if(i >= loadingMessages.length) i = 0 
        res.write(`event:progress\ndata:${JSON.stringify(loadingMessages[i])}\n\n`)
        i++
    }, 5000);
    
    const codeAndAudio = await generate(data)
    if(codeAndAudio) clearInterval(interval)

    // send the output into the queue
    const job = await queue.add("render" , codeAndAudio , {
        attempts : 2,
        backoff : {
            type : "exponential",
            delay : 3000
        },
        removeOnComplete : {
            age : 30 * 60
        },
        removeOnFail : {
            age : 30 * 60
        }
    })
    
    res.write(`event:jobAdded\ndata:${JSON.stringify(job.id)}\n\n`)
    res.end()

})

app.get("/video/:id" , async(req ,res)=>{
    const { id } = req.params

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const job = await queue.getJob(id)

    if(!job){
        res.write(`event:failed\ndata:${"job_not_found"}\n\n`)
        res.end()
        return
    }

    const status = await job.getState()

    if(status === "completed"){
        const result = job.returnvalue
        res.write(`event:completed\ndata:${JSON.stringify(result)}\n\n`)
        res.end()
        return
    }

    if(status === "failed"){
        const reason = job.failedReason
        res.write(`event:failed\ndata:${JSON.stringify(reason)}\n\n`)
        res.end()
        return
    }

    const progress = (data : { jobId: string; data: JobProgress })=>{
        const payload  = data.data as { type : string , message : string | { progress : number , ETA : string}}
        if(data.jobId === id){
            if(payload.type === "progress"){
                res.write(`event:progress\ndata:${JSON.stringify(payload.message)}\n\n`)
            }
            if(payload.type === "render"){
                if(typeof payload.message != "string")
                res.write(`event:render\ndata:${JSON.stringify({ progress : payload.message.progress , ETA : payload.message.ETA})}`)
            }
        }
    }   

    const completed = (data : {jobId: string ; returnvalue: string}) => {
        if(data.jobId === id){
            res.write(`event:completed\ndata:${JSON.stringify(data.returnvalue)}\n\n`)
            cleanup()
            res.end()
        }
    }

    const failed = (data : {jobId: string ; failedReason: string}) => {
        if(data.jobId === id){
            res.write(`event:failed\ndata:${JSON.stringify(data.failedReason)}\n\n`)
            cleanup()
            res.end()
        }
    }

    queueEvents.on("progress" , progress)
    queueEvents.on("completed" , completed)
    queueEvents.on("failed" , failed)


    function cleanup(){
        queueEvents.off("progress" , progress)
        queueEvents.off("completed" , completed)
        queueEvents.off("failed" , failed)
    }
    
    res.on("close" , ()=>{
        cleanup()
        res.end()
    })

})




app.listen(PORT , ()=>{
    console.log(`Listening on port:${PORT}`)
})