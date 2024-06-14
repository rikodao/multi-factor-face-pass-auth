import type { PreSignUpTriggerHandler } from "aws-lambda"
const AWS = require('aws-sdk');
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({});
const rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27' });
import { env } from '$amplify/env/pre-sign-up';
const bucketName = env.MULTIFACTOR_AUTHENTICATION_PASSWORD_FACE_US_EAST_1_BUCKET_NAME;


const crypto = require('crypto');
function hash(plainText:string){
  return  crypto.createHash('md5').update(plainText).digest('hex')
}


async function renameS3Object(oldKey:string, newKey:string) {
  console.log({bucketName});
  console.log({oldKey});
  console.log({newKey});
  
  try {
    // Copy the object to the new key
    const copyParams = {
      Bucket: bucketName,
      Key: newKey,
      CopySource: `${bucketName}/${oldKey}`,
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


export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log(event.request);
  
  const key = `sign-up/${event.request.userAttributes["address"]}`

  console.log({ bucketName, key });

  const params = {
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: key
      }
    },
    Attributes: ['ALL']
  };

  try {
    const data = await rekognition.detectFaces(params).promise();
    
    const faceCount = data.FaceDetails.length;
    if (faceCount !== 1) throw new Error(`Found ${faceCount} face. Only one face accept`)

      const emailHash = hash(event.request.userAttributes["email"])
      const signUpNewKey = `sign-up/${emailHash}.jpg`
      await renameS3Object(key, signUpNewKey) 
    
      event.response.autoConfirmUser = true;
      return event
      


  } catch (err) {
    console.error('Error detecting faces:', err);
    throw err;
  }
}

