import sharp from "sharp";

export type CompressImageResult = {
    data?:Buffer,
    success:boolean
}
export type CompressImageDTO = {
    fileBuffer:Buffer
}
export async function compressImage({fileBuffer}:CompressImageDTO):Promise<CompressImageResult>{
    try {
        const MAX_WIDTH_LARGE = 1200;
        const MAX_WIDTH_MEDIUM = 800;
        const MAX_WIDTH_SMALL = 600;
    
        const fileSizeKB = fileBuffer.byteLength / 1024;
    
        if (fileSizeKB < 100) {
            
            return {
                data:fileBuffer,
                success:true
            };
        }
    
        let width = MAX_WIDTH_MEDIUM;
        let quality = 80;
    
        if (fileSizeKB > 500) {
            width = MAX_WIDTH_SMALL;
            quality = 70;
        }
    
        const optimizedBuffer = await sharp(fileBuffer)
            .resize({ width, withoutEnlargement: true })
            .webp({quality})
            .toBuffer();
    
        return {data:optimizedBuffer,success:true};
    } catch (error:unknown) {
        return {success:false};
    }
}