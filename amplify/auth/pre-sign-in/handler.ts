import type { PreAuthenticationTriggerHandler } from "aws-lambda"
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({  });
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const client = new RekognitionClient({ });

// import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition"; 

const AWS = require('aws-sdk');

const rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27' });

const crypto = require('crypto');
function hash(plainText:string){
  return  crypto.createHash('md5').update(plainText).digest('hex')
}


function parseS3Url(s3Url:string) {
  const url = new URL(s3Url);
  const bucket = url.hostname.split('.')[0];
  const key = decodeURIComponent(url.pathname.substring(1));
  return { bucket, key };
}


async function renameS3Object(bucketName:string, oldKey:string, newKey:string) {
  console.log({bucketName});
  console.log({oldKey});
  console.log({newKey});
  
  try {
    // Copy the object to the new key
    const copyParams = {
      Bucket: bucketName,
      // CopySource: oldKey,
      CopySource: 'amplify-amplifyvitereactt-amplifygen2signupuseast1-f9snpdfweebu/sign-in/undefined.jpg',
      Key: newKey,
    };
    await s3Client.send(new CopyObjectCommand(copyParams));
    console.log(`Object copied to ${newKey}`);

  //   // Delete the original object
  //   const deleteParams = {
  //     Bucket: bucketName,
  //     Key: oldKey,
  //   };
  //   await s3Client.send(new DeleteObjectCommand(deleteParams));
  //   console.log(`Original object ${oldKey} deleted`);
  } catch (error) {
    throw new Error(`Error renaming object: ${error}`); 
    
  }
}



export const handler: PreAuthenticationTriggerHandler = async (event) => {
  const s3uri = event.request.userAttributes["address"]
  console.log({s3uri});
  
  const { bucket, key } = parseS3Url(s3uri);
  console.log({bucket});
  console.log({key});

  const emailHash = hash(event.request.userAttributes["email"])
  const signInNewKey = `sign-in/${emailHash}.jpg`
  
  await renameS3Object(bucket, key, signInNewKey) 



  console.log({ bucket, key });
  try {
    const signUpNewKey = `sign-up/${emailHash}.jpg`
    console.log({ bucket, signInNewKey, signUpNewKey });
    const params = {
      SourceImage: {
        S3Object: {
          Bucket: bucket,
          Name: signInNewKey,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: bucket,
          Name: signUpNewKey,
        },
      },
      SimilarityThreshold: 50, // 類似度の閾値
    };
    const command = new CompareFacesCommand(params);
    const response = await client.send(command);

    
    // const response = await rekognition.compareFaces(params)
    console.log('response:', response);
    console.log('FaceMatches:', response.FaceMatches);
    console.log('UnmatchedFaces:', response.UnmatchedFaces);

    if (response.FaceMatches && response.FaceMatches.length == 0) throw new Error("No faces matched.")
    const similarity = response.FaceMatches[0].Similarity;
    console.log(`Similarity: ${similarity}`);
    if (similarity <= 50) throw new Error("similarity below 50"); 
      
    console.log('Faces are similar enough.');
    return event
    
  } catch (error) {
    throw new Error (`Error comparing faces:, ${error}`); 
  }
}