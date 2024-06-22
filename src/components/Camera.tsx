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

// Set video constraints
// ビデオ制約を設定
const videoConstraints = {
    width: 1280, // Video width
    height: 720, // Video height
    facingMode: "user" // Use front camera
};

export default ({ image, setImage }: { image: string | null, setImage: any }) => {
    const webcamRef = useRef(null); // Hold a reference to the webcam

    const [deviceId, setDeviceId] = useState(videoConstraints); // Manage the state of the selected device ID
    const [devices, setDevices] = useState([]); // Manage the state of available devices
    const [isLoading, setIsLoading] = useState(false); // Manage the state of whether an image is being captured

    // Function to get available devices
    // 利用可能なデバイスを取得する関数
    const handleDevices = useCallback(
        (mediaDevices: never[]) =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    // Get available devices when the component is mounted
    // コンポーネントがマウントされたときに、利用可能なデバイスを取得する
    useEffect(
        () => {
            {/* @ts-ignore */ }
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        },
        [handleDevices]
    );

    // Generate a dropdown to select the camera device
    // カメラデバイスを選択するためのドロップダウンを生成する関数
    const cameraSelector = () => {
        {/* @ts-ignore */ }
        const option = devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)

        return (
            <SelectField
                label="Select your camera device" // Label
                /* @ts-ignore */
                value={deviceId.deviceId} // Selected device ID
                onClick={() => {
                    /* @ts-ignore */
                    navigator.mediaDevices.enumerateDevices().then(handleDevices); // Re-fetch devices
                }}
                onChange={(e) => {
                    /* @ts-ignore */
                    setDeviceId({ ...videoConstraints, deviceId: e.target.value }) // Update device ID
                }}
            >
                {option}
            </SelectField>
        )
    }

    // Function to capture an image
    // 画像をキャプチャする関数
    const capture = useCallback(async () => {
        setIsLoading(true) // Set the loading flag
        /* @ts-ignore */
        const imageSrc = webcamRef.current?.getScreenshot(); // Get screenshot from webcam
        if (imageSrc) {
            await setImage(imageSrc) // Pass the image to the parent component
            setIsLoading(false) // Set the capture complete flag
        }
    }, [webcamRef]);

    return (
        <>
            <View as="div" margin="1rem" borderRadius="6px" boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)" >
                <Card variation="elevated" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {image ? <>
                        <Image
                            src={image} // Display the captured image
                            alt="img"
                        />
                        <Button onClick={setImage.bind(this, null)}>Retry</Button> {/* Retry button */}
                    </> :
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Webcam
                                    audio={false} // Disable audio
                                    width={360} // Webcam width
                                    height={240} // Webcam height
                                    ref={webcamRef} // Pass the webcam reference
                                    screenshotFormat="image/jpeg" // Screenshot format
                                    videoConstraints={deviceId} // Pass the selected device ID
                                />
                            </div>
                            <div>{cameraSelector()}</div> {/* Display device selection dropdown */}
                            <View as="div" marginTop="1rem">
                                <ButtonGroup justifyContent="center">
                                    {/* @ts-ignore */}
                                    <Button variation="primary" isLoading={isLoading} onClick={capture.bind(this)} >Capture</Button> {/* Capture button */}
                                </ButtonGroup>
                            </View>
                        </>
                    }
                </Card>
            </View>
        </>
    );
};