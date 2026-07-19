import { Worker } from "bullmq";
import { client } from "./redisClient";
import { generateAudio } from "./audio";
import fs from "fs"
import { renderVideo } from "./renderer";

const worker = new Worker("video_render" , async(job)=>{

    const remotion_code = job.data.remotion_code
    const audio_scripts = job.data.scriptPerSequence

    // generate audio first
    const audioDuration = await generateAudio(audio_scripts , job)
    const totalDuration = audioDuration.reduce((acc , el) => acc + el , 0)

    await job.updateProgress({ type : "progress" , message : "Voiceovers created successfully"})

    const codeWithAudioDurations = `
        const durations = ${JSON.stringify(audioDuration)}
        const TOTAL_DURATION = ${totalDuration}

        ${remotion_code}
    `
    // save the code in a file with jobId
    const filepath = `./generated/video_${job.id}.tsx`
    fs.writeFileSync(filepath , codeWithAudioDurations)

    // generate video 
    await renderVideo(filepath , job)

    // later upload the video in some object store
    return true

}, {
    connection : client
})