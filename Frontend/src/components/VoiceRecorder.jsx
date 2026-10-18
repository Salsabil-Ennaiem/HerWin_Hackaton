import { useReactMediaRecorder } from "react-media-recorder";

export default function VoiceRecorder({ onRecorded, onClear }) {
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl, error } =
    useReactMediaRecorder({
      audio: true,
      onStop: (_url, blob) => onRecorded(blob),
    });

  const recording = status === "recording";

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-base-200 rounded-xl">
      {error && error !== "none" && (
        <p className="text-error text-sm">Microphone unavailable ({error}). Please type instead.</p>
      )}

      <button
        className={`btn btn-circle btn-lg ${recording ? "btn-error animate-pulse" : "btn-primary"}`}
        onClick={recording ? stopRecording : startRecording}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {recording ? "■" : "●"}
      </button>
      <span className="text-sm opacity-70">
        {recording ? "Recording… tap to stop" : mediaBlobUrl ? "Recorded" : "Tap to record"}
      </span>

      {mediaBlobUrl && !recording && (
        <>
          <audio src={mediaBlobUrl} controls className="w-full" />
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => { clearBlobUrl(); onClear(); }}
          >
            Record again
          </button>
        </>
      )}
    </div>
  );
}