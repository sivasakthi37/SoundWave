var ctx;
var width, height;

var dataArray;
var analyser;

var run = true;

// var hue = 0;
// var hueAdd = 1;
let audio

window.addEventListener("load", (event) => {
    let theCanvas = document.getElementById("aCanvas");
    resizeCanvas(theCanvas, false);
    // width = theCanvas.width;
    // height = theCanvas.height;
    theCanvas.width = 326
    theCanvas.height = 344
    width = 326;
    height = 344;

    ctx = theCanvas.getContext("2d");
    // console.log('envvvvvvv', import.meta.env.VITE_GOOGLE_API)
    const handleMessage = async (event) => {
        event.preventDefault();
        // console.log("event", event);
        if (typeof event.data === 'string') {
            const message = event.data && JSON.parse(event.data);
            console.log("Received message:", message);
            if (message.action === "stop") {

                if (audio) {
                    audio.pause();  // Pauses the playback
                    audio.currentTime = 0;  // Resets the playback position to the start
                }
            }
            if (message.text) {
                const requestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        input: {
                            text: message.text
                        },
                        voice: {
                            languageCode: "en-US",
                            name: "en-US-Studio-O"
                        },
                        audioConfig: {
                            audioEncoding: "MP3",
                            effectsProfileId: ["small-bluetooth-speaker-class-device"],
                            pitch: 0,
                            speakingRate: 1
                        }
                    }),
                };
                const apiKey = 'AIzaSyD6Z6xv9MAYVQkpM8naWMsN2KmLE2jVA14';
                await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, requestOptions)
                    .then(response => response.json())
                    .then(responseData => {
                        const audioContent = responseData.audioContent;
                        generateAudio(audioContent)
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    });
            }

        }
    };

    window.addEventListener('message', handleMessage)
});

async function generateAudio(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    console.log("Bytes Array", byteArray)

    const blob = new Blob([byteArray], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    audio = document.getElementById("audioSource");
    audio.src = url;
    audio.load();
    audio.play();
    // Add an event listener for the 'ended' event
    function endedResponse() {
        if (window.ReactNativeWebView) {
            // console.log('window ended',);
            console.log('ended response');
            // @ts-ignore
            window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'audioEnded' }));
        } else {
            console.log('Post message in browser ');
        }
        audio.removeEventListener('ended', endedResponse);
        // console.log("Playback has ended.");
        // Perform any additional actions after the audio has ended
    }
    audio.addEventListener('ended', endedResponse);
    startVis(audio);
}

function startVis(audioElement) {
    // shape style
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#16D1FE';

    // make sure AudioContext will work fine in different browsers
    let audioCtx = new AudioContext();

    // copy audio source data to manipulate later
    let source = audioCtx.createMediaElementSource(audioElement);

    // create audio analyser
    analyser = audioCtx.createAnalyser();

    // set audio analyser
    analyser.fftSize = 256;
    let bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // Bind our analyser to the media element source.
    source.connect(analyser);
    source.connect(audioCtx.destination);

    // document.getElementById("start").disabled = true;

    audioVisualize_3();
}


//Circle Spikes Visualization
function audioVisualize_3() {
    if (!run) {
        return;
    }
    analyser.getByteTimeDomainData(dataArray);

    // clear the previous shape
    //ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fill();

    drawImageCentered();
    let radius = 127;
    let cX = width / 2;
    let cY = height / 2;

    let radianAdd = Constants.TWO_PI / dataArray.length;
    let radian = 0;
    // console.log('radianAdd', radianAdd);
    for (let i = 0; i < dataArray.length; i++) {
        // console.log('radian');
        let x = radius * Math.cos(radian) + cX;
        let y = radius * Math.sin(radian) + cY;
        ctx.beginPath();
        ctx.moveTo(x, y);

        var v = dataArray[i];
        if (v < radius) {
            v = radius;
        }
        x = v * Math.cos(radian) + cX;
        y = v * Math.sin(radian) + cY;

        // console.log('x,y', x, y);
        ctx.lineTo(x, y);
        ctx.stroke();

        radian += radianAdd;
    }

    requestAnimationFrame(audioVisualize_3);
}


function drawImageCentered() {

    var desiredWidth = 200; // Adjust this value as needed
    var desiredHeight = 180; // Adjust this value as needed

    // Define padding and margin
    var padding = 20; // Adjust this value as needed
    var marginX = 50; // Adjust this value as needed
    var marginY = 50; // Adjust this value as needed

    // Calculate the position to center the image on the canvas
    var x = marginX + (width - marginX * 2 - desiredWidth - padding * 2) / 2;
    var y = marginY + (height - marginY * 2 - desiredHeight - padding * 2) / 2;
    var img = new Image();
    img.src = "./clarus.jpeg";
    // Draw the image with the desired width and height
    ctx.drawImage(img, x + padding, y + padding, desiredWidth, desiredHeight);

}