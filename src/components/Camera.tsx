
import {
    Image,
    Button,
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

export default ({ image, setImage }: { image: string | null, setImage: any }) => {
    const webcamRef = useRef(null);

    const [deviceId, setDeviceId] = useState(videoConstraints);
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleDevices = useCallback(
        (mediaDevices: never[]) =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    useEffect(
        () => {
            {/* @ts-ignore */ }
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        },
        [handleDevices]
    );
    const cameraSelector = () => {
        {/* @ts-ignore */ }
        const option = devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)

        return (

            <SelectField
                label="Select your camera device"
                /* @ts-ignore */
                value={deviceId.deviceId}
                onClick={() => {
                    /* @ts-ignore */
                    navigator.mediaDevices.enumerateDevices().then(handleDevices);
                }}
                onChange={(e) => {
                    /* @ts-ignore */
                    setDeviceId({ ...videoConstraints, deviceId: e.target.value })
                }}
            >
                {option}
            </SelectField>

        )
    }


    const capture = useCallback(async () => {
        setIsLoading(true)
        /* @ts-ignore */
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            await setImage(imageSrc)
            setIsLoading(false)
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
                                    {/* @ts-ignore */}
                                    <Button variation="primary" isLoading={isLoading} onClick={capture.bind(this)} >Capture</Button>
                                </ButtonGroup>
                            </View>
                        </>
                    }
                </Card>
            </View>
        </>
    );
};