import { useEffect, useRef } from 'react';

export default function AmbientAudio({ active, zenMode }) {
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);

  useEffect(() => {
    if (active && zenMode) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 350; 

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 900;
        bandpass.Q.value = 1.2;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.12; 

        const gainBP = ctx.createGain();
        gainBP.gain.value = 0.03;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.connect(bandpass);
        bandpass.connect(gainBP);
        bandpass.connect(ctx.destination);

        whiteNoise.start();
        audioSourceRef.current = whiteNoise;
      } catch (err) {
        console.error("Failed to play synthesized rain sound", err);
      }
    } else {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (err) { console.warn("Failed to stop audio source", err); }
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (err) { console.warn("Failed to close audio context", err); }
        audioContextRef.current = null;
      }
    }

    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (err) { console.warn("Failed to stop audio source", err); }
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (err) { console.warn("Failed to close audio context", err); }
        audioContextRef.current = null;
      }
    };
  }, [active, zenMode]);

  return null;
}
