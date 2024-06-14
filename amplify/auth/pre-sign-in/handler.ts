import type { PreAuthenticationTriggerHandler } from "aws-lambda"
const { S3Client, CopyObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ });
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const client = new RekognitionClient({ });
import { env } from '$amplify/env/pre-sign-in';
const bucketName = env.MULTIFACTOR_AUTHENTICATION_PASSWORD_FACE_US_EAST_1_BUCKET_NAME;


const AWS = require('aws-sdk');

const rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27' });

const crypto = require('crypto');
function hash(plainText:string){
  return  crypto.createHash('md5').update(plainText).digest('hex')
}

async function renameS3Object(oldKey:string, newKey:string) {
  console.log({oldKey});
  console.log({newKey});
  console.log({bucketName});
  
  try {
    // Copy the object to the new key
    const copyParams = {
      Bucket: bucketName,
      // CopySource: oldKey,
      CopySource: `${bucketName}/${oldKey}`,
      Key: newKey,
    };
    await s3Client.send(new CopyObjectCommand(copyParams));
    console.log(`Object copied to ${newKey}`);
  } catch (error) {
    throw new Error(`Error renaming object: ${error}`); 
    
  }
}



export const handler: PreAuthenticationTriggerHandler = async (event) => {
  const signIn='sign-in'
  const key = `${signIn}/${event.request.userAttributes["address"]}`
  console.log({key});
  
  const emailHash = hash(event.request.userAttributes["email"])
  const fileName = `${emailHash}.jpg`
  const signInNewKey = `${signIn}/${fileName}`
  
  await renameS3Object(key, signInNewKey) 


  try {
    const signUpNewKey = `sign-up/${fileName}`
    console.log({  signInNewKey, signUpNewKey });
    const params = {
      SourceImage: {
        S3Object: {
          Bucket: bucketName,
          Name: signInNewKey,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: bucketName,
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