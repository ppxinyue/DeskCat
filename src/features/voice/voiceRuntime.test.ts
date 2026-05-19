import assert from 'node:assert/strict';
import test from 'node:test';

import {
  audioFileNameForMimeType,
  canUseSystemSpeechOutput,
  getSpeechRecognitionConstructor,
  getSystemSpeechInputSupport,
  pickRecordingMimeTypeFromSupport,
  resolveVoiceLanguage,
} from './voiceRuntime.ts';

test('recording MIME type prefers Chromium WebM Opus when available', () => {
  const mimeType = pickRecordingMimeTypeFromSupport((candidate) => candidate === 'audio/webm;codecs=opus');

  assert.equal(mimeType, 'audio/webm;codecs=opus');
});

test('recording MIME type falls back through Windows-friendly alternatives', () => {
  const mimeType = pickRecordingMimeTypeFromSupport((candidate) => candidate === 'audio/mp4');

  assert.equal(mimeType, 'audio/mp4');
});

test('recording MIME type is empty when MediaRecorder support probing is unavailable', () => {
  assert.equal(pickRecordingMimeTypeFromSupport(undefined), '');
});

test('audio file names match selected recording MIME types', () => {
  assert.equal(audioFileNameForMimeType('audio/webm;codecs=opus'), 'recording.webm');
  assert.equal(audioFileNameForMimeType('audio/mp4'), 'recording.m4a');
  assert.equal(audioFileNameForMimeType('audio/wav'), 'recording.wav');
  assert.equal(audioFileNameForMimeType('audio/ogg;codecs=opus'), 'recording.ogg');
  assert.equal(audioFileNameForMimeType('audio/mpeg'), 'recording.mp3');
});

test('system speech input reports missing microphone separately from missing recognition', () => {
  assert.deepEqual(getSystemSpeechInputSupport({}, {}), {
    supported: false,
    reason: 'microphone-unavailable',
  });

  assert.deepEqual(getSystemSpeechInputSupport({}, { mediaDevices: { getUserMedia: () => Promise.resolve() } }), {
    supported: false,
    reason: 'speech-recognition-unavailable',
  });
});

test('system speech input accepts standard and webkit recognition constructors', () => {
  class Recognition {}
  const navigatorLike = { mediaDevices: { getUserMedia: () => Promise.resolve() } };

  assert.equal(getSpeechRecognitionConstructor({ SpeechRecognition: Recognition }), Recognition);
  assert.deepEqual(getSystemSpeechInputSupport({ webkitSpeechRecognition: Recognition }, navigatorLike), {
    supported: true,
    reason: 'ok',
  });
});

test('system speech output requires synthesis and utterance support', () => {
  class Utterance {}

  assert.equal(canUseSystemSpeechOutput({ speechSynthesis: {}, SpeechSynthesisUtterance: Utterance }), true);
  assert.equal(canUseSystemSpeechOutput({ speechSynthesis: {} }), false);
});

test('voice language uses explicit settings before navigator language', () => {
  assert.equal(resolveVoiceLanguage('en-US', 'zh-CN'), 'en-US');
  assert.equal(resolveVoiceLanguage('system', 'zh-TW'), 'zh-TW');
  assert.equal(resolveVoiceLanguage('', ''), 'zh-CN');
});
