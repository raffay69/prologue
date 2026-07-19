import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type { Job } from 'bullmq';
import path from 'path';
import { formatTime } from './utils';

export async function renderVideo(filepath : string , job : Job) {
    const compositionId = 'video';

    const bundleLocation = await bundle({
    entryPoint: path.resolve(filepath),
    onProgress : async (progress)=>{
        await job.updateProgress({type : "render" , message : {progress : Math.round(progress) , ETA : "Calculating.."}})
        console.log(`Bundling : ${Math.round(progress)}%`)
    }
    });

    const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
    });

    await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: `out/video_${job.id}.mp4`,
        onProgress : async (progress)=>{
            await job.updateProgress({type : "render" , message : {progress : Math.round(progress.progress * 100) , ETA : formatTime(progress.renderEstimatedTime)}})
            console.log(`Progress: ${Math.round(progress.progress * 100)}%`);
            console.log(`ETA: ${formatTime(progress.renderEstimatedTime)}`);
        }
    });
}