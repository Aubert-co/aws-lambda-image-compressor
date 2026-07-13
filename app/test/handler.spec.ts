import { S3Event } from 'aws-lambda';
import * as compress from '../src/compress'
import {handler} from '../src/main'
import * as AwsStorage from '../src/uploadFile';
const spyCompress = jest.spyOn(compress,'compressImage')

const spyAwsDelete = jest.spyOn(AwsStorage.AwsStorage.prototype,'delete')
const spyAwsUpload = jest.spyOn(AwsStorage.AwsStorage.prototype,'upload')
const spyAwsGet = jest.spyOn(AwsStorage.AwsStorage.prototype,'get')
const imgDestination = "market"
const imageName = "image"
const IMAGEKEY = `tmp/${imgDestination}/${imageName}.png`
describe("",()=>{
    const imgBuffer = Buffer.from([1])
    const s3EventMock = {
  Records: [
    {
      eventVersion: "2.1",
      eventSource: "aws:s3",
      awsRegion: "us-east-1",
      eventTime: "2026-07-13T12:00:00.000Z",
      eventName: "ObjectCreated:Put",
      userIdentity: {
        principalId: "AWS:test",
      },
      requestParameters: {
        sourceIPAddress: "127.0.0.1",
      },
      responseElements: {
        "x-amz-request-id": "request-id",
        "x-amz-id-2": "extended-request-id",
      },
      s3: {
        s3SchemaVersion: "1.0",
        configurationId: "image-upload-trigger",
        bucket: {
          name: "superstore-images",
          ownerIdentity: {
            principalId: "AWS:test",
          },
          arn: "arn:aws:s3:::superstore-images",
        },
        object: {
          key: IMAGEKEY,
          size: 1024,
          eTag: "test-etag",
          sequencer: "test-sequencer",
        },
      },
    },
  ],
} as S3Event;
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should process, upload and delete the original image successfully", async () => {
        spyAwsGet.mockResolvedValue({success:true,fileBuffer:imgBuffer,mimeType:"img/png"})
        spyCompress.mockResolvedValue({data:imgBuffer,success:true})
        spyAwsUpload.mockResolvedValue({success:true})
        spyAwsDelete.mockResolvedValue({success:true})
        await handler(s3EventMock)

        expect(spyAwsGet).toHaveBeenCalledWith(
            expect.objectContaining({
            urlPath:IMAGEKEY
        })
        )
        expect(spyCompress).toHaveBeenCalledWith({
            fileBuffer:imgBuffer
        })
        expect(spyAwsUpload).toHaveBeenCalledWith({
            fileBuffer:imgBuffer,
            urlPath:`${imgDestination}/${imageName}.webp`,
            mimeType:"image/webp"
        })
        expect(spyAwsDelete).toHaveBeenCalledWith({
            urlPath:IMAGEKEY
        })
    })
    it("should throw an error when the original image cannot be retrieved", async () => {
    spyAwsGet.mockResolvedValue({success:false,error:"Something wrong"})

    await expect(handler(s3EventMock)).rejects.toThrow();

    expect(spyAwsGet).toHaveBeenCalledWith(
      expect.objectContaining({
        urlPath: IMAGEKEY,
      }),
    );

    expect(spyCompress).not.toHaveBeenCalled();
    expect(spyAwsUpload).not.toHaveBeenCalled();
    expect(spyAwsDelete).not.toHaveBeenCalled();
  });

  it("should throw an error when image compression fails", async () => {
    spyAwsGet.mockResolvedValue({
      success: true,
      fileBuffer: imgBuffer,
      mimeType: "image/png",
    });

    spyCompress.mockResolvedValue({
      success: false,
    });

    await expect(handler(s3EventMock)).rejects.toThrow();

    expect(spyCompress).toHaveBeenCalledWith({
      fileBuffer: imgBuffer,
    });

    expect(spyAwsUpload).not.toHaveBeenCalled();
    expect(spyAwsDelete).not.toHaveBeenCalled();
  });

  it("should throw an error and preserve the temporary image when upload fails", async () => {
    spyAwsGet.mockResolvedValue({
      success: true,
      fileBuffer: imgBuffer,
      mimeType: "image/png",
    });

    spyCompress.mockResolvedValue({
      success: true,
      data: imgBuffer,
    });

    spyAwsUpload.mockResolvedValue({
      success: false,
    });

    await expect(handler(s3EventMock)).rejects.toThrow();

    expect(spyAwsUpload).toHaveBeenCalledWith({
      fileBuffer: imgBuffer,
      urlPath: `${imgDestination}/${imageName}.webp`,
      mimeType: "image/webp",
    });

    expect(spyAwsDelete).not.toHaveBeenCalled();
  });

  it("should throw an error when the temporary image cannot be deleted", async () => {
    spyAwsGet.mockResolvedValue({
      success: true,
      fileBuffer: imgBuffer,
      mimeType: "image/png",
    });

    spyCompress.mockResolvedValue({
      success: true,
      data: imgBuffer,
    });

    spyAwsUpload.mockResolvedValue({
      success: true,
    });

    spyAwsDelete.mockResolvedValue({
      success:false,error:"failed",
    });

    await expect(handler(s3EventMock)).rejects.toThrow();

    expect(spyAwsDelete).toHaveBeenCalledWith({
      urlPath: IMAGEKEY,
    });
  });
})