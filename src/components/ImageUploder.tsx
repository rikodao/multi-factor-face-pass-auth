
import {
    Image,
    Button,
    Alert,
    Card,
    View,
    SelectField,
    ButtonGroup
} from '@aws-amplify/ui-react';
import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
};
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from "../../amplify_outputs.json";

export default ({ sessionid }: {sessionid: string}) => {
    const webcamRef = useRef(null);
    const [presignedURL, setPresignedURL] = useState(null);
    const [deviceId, setDeviceId] = useState(videoConstraints);
    const [image, setImage] = useState(null);
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleDevices = useCallback(
        (mediaDevices: MediaDeviceInfo[]) =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        },
        [handleDevices]
    );
    const cameraSelector = () => {
        const option = devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)

        return (
            <SelectField
                label="Select your camera device"
                value={deviceId.deviceId}
                onClick={() => {
                    navigator.mediaDevices.enumerateDevices().then(handleDevices);
                }}
                onChange={(e) => {
                    setDeviceId({ ...videoConstraints, deviceId: e.target.value })
                }}
            >
                {option}
            </SelectField>

        )
    }

    async function getPresignedUrl(sessionid: string) {
        const { credentials } = await fetchAuthSession();
        console.log(credentials);
        const awsRegion = outputs.auth.aws_region;
        const functionName = outputs.custom.preSignedUrlFunctionName;
        
        const labmda = new LambdaClient({ credentials: credentials, region: awsRegion });
        const command = new InvokeCommand({
            FunctionName: functionName,
            Payload: Buffer.from(JSON.stringify({ key: sessionid })),
        });
        const apiResponse = await labmda.send(command);
        console.log(apiResponse);

        if (apiResponse.Payload) {
            const payloadStr = new TextDecoder().decode(apiResponse.Payload);


            const payload = JSON.parse(payloadStr);
            console.log(payload.body);
            setPresignedURL(payload.body)
        }
    }


    useEffect(() => {
        getPresignedUrl(sessionid)
    }, [sessionid])




    /*
   * Upload Image to S3
   */
    const handleUploadImagetoS3 = async (imageSrc: string, presignedURL: string) => {
        const res = await fetch(imageSrc)
        const blob = await res.blob()
        const response = await fetch(presignedURL, {
            method: 'PUT',
            body: blob,
            headers: {
                'Content-Type': 'image/jpeg',
            }
        })

        if (!response.ok) {
            alert("Error happen")
            console.error("Erorr")
            console.error(response)
            return {
                body: null
            };
        }
    };

    const capture = useCallback(async (presignedURL: string) => {

        setIsLoading(true)
        await getPresignedUrl(sessionid)
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            handleUploadImagetoS3(imageSrc, presignedURL)
                .then(() => setImage(imageSrc))
                .finally(() => setIsLoading(false));
        }
    }, [webcamRef]);

    return (
        <>
            <View as="div" margin="1rem" borderRadius="6px" boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)" >
                <Card variation="elevated" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {image ? <>
                        <Image
                            src={image}
                            alt="img"

                        />
                        <Button onClick={setImage.bind(this, null)}>Retry</Button>
                    </> :
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Webcam
                                    audio={false}
                                    width={360}
                                    height={240}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={deviceId}

                                />
                            </div>
                            <div>{cameraSelector()}</div>
                            <View as="div" marginTop="1rem">
                                <ButtonGroup justifyContent="center">

                                    <Button variation="primary" isLoading={isLoading} onClick={capture.bind(this, presignedURL)} >Capture</Button>
                                </ButtonGroup>
                            </View>
                        </>
                    }
                </Card>
            </View>
        </>
    );
};