import { execFile } from "node:child_process";
export async function applyRadioEffect(input: string, output: string) {
  const filter="[0:a]highpass=f=300,lowpass=f=3400,compand=attacks=0.02:decays=0.25:points=-80/-900|-70/-20|0/-10|20/-8:gain=6,volume=1.2[a];anoisesrc=color=white:amplitude=0.02[ns];[a][ns]amix=inputs=2:weights=1 0.25:duration=shortest,volume=1.0,aecho=0.6:0.7:8:0.08,acompressor=threshold=0.6:ratio=6:attack=20:release=200";
  await new Promise<void>((res,rej)=>
    execFile("ffmpeg",["-y","-i",input,"-filter_complex",filter,"-ar","16000",output],
      (err,_,stderr)=>err?rej(new Error(stderr)):res())
  );
}
