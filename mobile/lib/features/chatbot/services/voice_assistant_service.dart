import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// High-performance, on-device Voice Service providing Speech-to-Text (STT)
/// and Text-to-Speech (TTS) for the Nexa Academic Assistant.
class VoiceAssistantService {
  static final VoiceAssistantService _instance = VoiceAssistantService._internal();
  factory VoiceAssistantService() => _instance;
  VoiceAssistantService._internal();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();

  bool _speechInitialized = false;
  bool _isListening = false;
  bool _isSpeaking = false;
  String? _currentlySpeakingId;

  bool get isListening => _isListening;
  bool get isSpeaking => _isSpeaking;
  String? get currentlySpeakingId => _currentlySpeakingId;

  /// Initializes the on-device TTS engine with default voice attributes.
  Future<void> initTts() async {
    try {
      await _tts.setLanguage('en-US');
      await _tts.setSpeechRate(0.48);
      await _tts.setVolume(1.0);
      await _tts.setPitch(1.0);

      _tts.setStartHandler(() {
        _isSpeaking = true;
      });

      _tts.setCompletionHandler(() {
        _isSpeaking = false;
        _currentlySpeakingId = null;
      });

      _tts.setErrorHandler((dynamic msg) {
        _isSpeaking = false;
        _currentlySpeakingId = null;
        debugPrint('[VoiceAssistantService] TTS Error: $msg');
      });
    } catch (e) {
      debugPrint('[VoiceAssistantService] Init TTS failed: $e');
    }
  }

  /// Initializes the SpeechToText listener. Returns true if available.
  Future<bool> initSpeech({
    Function(String status)? onStatus,
    Function(String error)? onError,
  }) async {
    if (_speechInitialized) return true;
    try {
      _speechInitialized = await _speech.initialize(
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            _isListening = false;
          }
          if (onStatus != null) onStatus(status);
        },
        onError: (errorNotification) {
          _isListening = false;
          if (onError != null) onError(errorNotification.errorMsg);
        },
      );
      return _speechInitialized;
    } catch (e) {
      debugPrint('[VoiceAssistantService] Speech init failed: $e');
      _speechInitialized = false;
      return false;
    }
  }

  /// Starts listening to the microphone and streams the recognized text.
  Future<bool> startListening({
    required Function(String words) onResult,
    required Function(String error) onError,
  }) async {
    try {
      await stopSpeaking();

      final available = await initSpeech(
        onError: onError,
      );

      if (!available) {
        onError('Microphone permission not granted or speech unavailable');
        return false;
      }

      _isListening = true;
      await _speech.listen(
        onResult: (result) {
          onResult(result.recognizedWords);
        },
        listenOptions: stt.SpeechListenOptions(
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 3),
          partialResults: true,
          cancelOnError: true,
          listenMode: stt.ListenMode.confirmation,
        ),
      );
      return true;
    } catch (e) {
      _isListening = false;
      onError(e.toString());
      return false;
    }
  }

  /// Stops active microphone recording.
  Future<void> stopListening() async {
    if (_isListening) {
      try {
        await _speech.stop();
      } catch (_) {}
      _isListening = false;
    }
  }

  /// Reads aloud the provided text, stripping formatting characters for natural cadence.
  Future<void> speak(String text, {String? messageId}) async {
    try {
      await stopSpeaking();
      await stopListening();

      final cleaned = _sanitizeForSpeech(text);
      if (cleaned.isEmpty) return;

      _currentlySpeakingId = messageId;
      _isSpeaking = true;
      await _tts.speak(cleaned);
    } catch (e) {
      _isSpeaking = false;
      _currentlySpeakingId = null;
      debugPrint('[VoiceAssistantService] Speak error: $e');
    }
  }

  /// Halts any active text-to-speech utterance.
  Future<void> stopSpeaking() async {
    try {
      await _tts.stop();
    } catch (_) {}
    _isSpeaking = false;
    _currentlySpeakingId = null;
  }

  /// Disposes and cancels all speech activities.
  Future<void> dispose() async {
    await stopSpeaking();
    await stopListening();
  }

  /// Strips Markdown tokens, links, and code blocks for smooth speech output.
  String _sanitizeForSpeech(String raw) {
    return raw
        .replaceAll(RegExp(r'\*+'), '')
        .replaceAll(RegExp(r'#+\s*'), '')
        .replaceAll(RegExp(r'`+[^`]*`+'), '')
        .replaceAll(RegExp(r'https?:\/\/\S+'), '')
        .replaceAll(RegExp(r'\[(.*?)\]\(.*?\)'), r'$1')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }
}

