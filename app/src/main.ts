import { compressImage } from "./compress";
import { AwsStorage } from "./uploadFile"
import type {S3Event} from "aws-lambda"



export const handler =async (event:S3Event)=>{
   try{
        const record = event.Records[0]
        const key = decodeURIComponent(
            record.s3.object.key.replace(/\+/g, " ")
        );
        const parts = key.split("/");

        const tempFolder = parts[0];
        const destinationFolder = parts[1];
        const fileName = parts[parts.length-1].split('.')[0]
        if(!fileName){
            throw new Error("Faile name invalid")
        }
        const storage = new AwsStorage()
        const img = await storage.get({
            urlPath:key
        })
        if(!img.success){
            throw new Error(img.error)
        }
        const compress = await compressImage({
            fileBuffer:img.fileBuffer
        })
        if(!compress.data){
            throw new Error("Failed to compress")
        }
        const upload = await storage.upload({
            fileBuffer:compress.data,
            urlPath:`${destinationFolder}/${fileName}.webp`,
            mimeType:"image/webp"
        })
        if(!upload.success){
            throw new Error(upload.error)
        }
        const deleteImg = await storage.delete({
            urlPath:key
        })
        if(deleteImg.error){
            throw new Error(deleteImg.error)
        }
    }catch(err:unknown){
        throw err
    }

}