let mediaRecorder;
let recordedChunks = [];
let isPaused = false;
let isMuted = false;

async function recordScreen() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "always",
      mediaSource: "screen",
    },
  });

  const audio = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    },
  });

  return { stream, audio };
}

async function startRecording() {
  const { stream, audio } = await recordScreen();

  try {
    const mixedStream = new MediaStream([
      ...stream.getTracks(),
      ...audio.getTracks(),
    ]);

    mediaRecorder = new MediaRecorder(mixedStream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function () {
      document.getElementById("muteBtn").disabled = true;

      saveFile(recordedChunks);

      const blob = new Blob(recordedChunks, { type: "video/mp4" });
      const videoUrl = URL.createObjectURL(blob);
      const videoPlayer = document.getElementById("videoPlayer");
      videoPlayer.src = videoUrl;

      recordedChunks = [];
      stream.getTracks().forEach((track) => track.stop());
      audio.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.onpause = () => {
      isPaused = true;
      document.getElementById("pauseBtn").textContent = "Resume Recording";
      document.getElementById("muteBtn").disabled = true;
    };

    mediaRecorder.onresume = () => {
      isPaused = false;
      document.getElementById("pauseBtn").textContent = "Pause Recording";
      document.getElementById("muteBtn").disabled = false;
    };

    mediaRecorder.onstart = () => {
      document.getElementById("startBtn").disabled = true;
      document.getElementById("pauseBtn").disabled = false;
      document.getElementById("stopBtn").disabled = false;
      document.getElementById("muteBtn").disabled = false;
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
}

function pauseResumeRecording() {
  if (isPaused) {
    mediaRecorder.resume();
  } else {
    mediaRecorder.pause();
  }
}

function stopRecording() {
  mediaRecorder.stop();
  document.getElementById("startBtn").disabled = false;
  document.getElementById("pauseBtn").disabled = true;
  document.getElementById("stopBtn").disabled = true;
  document.getElementById("muteBtn").disabled = true;
}

function toggleMute() {
  isMuted = !isMuted;
  mediaRecorder.stream.getAudioTracks()[0].enabled = !isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? `Unmute` : `Mute`;
}

function saveFile(recordedChunks) {
  const blob = new Blob(recordedChunks, {
    type: "video/mp4",
  });

  let filename = window.prompt("Enter file name"),
    downloadLink = document.createElement("a");

  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${filename}.mp4`;

  document.body.appendChild(downloadLink);
  downloadLink.click();

  URL.revokeObjectURL(blob); // clear from memory
  document.body.removeChild(downloadLink);
}
