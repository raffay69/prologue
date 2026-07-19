import { UniversalEdgeTTS } from "edge-tts-universal";
import getAudioDurationInSeconds from "get-audio-duration";
import fs from "fs"
import type { Job } from "bullmq";

export async function generateAudio(arr : string[] , job : Job){
    const AUDIO_DURATION = []
    for(let i = 0 ; i < arr.length ; i ++){
        // generating audio track
        await job.updateProgress({type : "progress" , message : `Creating voiceover ${i + 1} of ${arr.length}` })
        const tts = new UniversalEdgeTTS( arr[i]!, 'en-US-AvaNeural');
        const result = await tts.synthesize();
        const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
        fs.writeFileSync(`./public/audio_${i}.mp3`, audioBuffer);
        const duration = await getAudioDurationInSeconds(`./public/audio_${i}.mp3`)
        AUDIO_DURATION.push(Math.ceil(duration * 60))
    }
    return AUDIO_DURATION
}