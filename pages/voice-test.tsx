import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceTest() {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [browserType, setBrowserType] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('safari')) return 'Safari';
    return 'Unknown';
  };

  const startVoiceInput = () => {
    const browser = detectBrowser();
    setBrowserType(browser);
    console.log('🎤 Starting voice input on:', browser);
    
    if (browser === 'Firefox' || !('webkitSpeechRecognition' in window)) {
      startRecording();
    } else {
      startSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    console.log('🎤 Using Speech Recognition API');
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += result;
        } else {
          interimTranscript += result;
        }
      }

      const fullText = finalTranscript + interimTranscript;
      console.log('📝 Transcript:', fullText);
      setTranscript(fullText);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      setError(`Speech Recognition Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('⏹️ Speech recognition ended');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('❌ Failed to start recognition:', err);
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  };

  const startRecording = async () => {
    console.log('🎙️ Using Audio Recording (Firefox mode)');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, transcribing...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);

    } catch (err) {
      console.error('❌ Recording error:', err);
      setError('Microphone access denied or not available');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    console.log('🔄 Transcribing audio blob, size:', audioBlob.size);
    
    // Mock transcription for demo (replace with actual OpenAI Whisper API call)
    setTranscript('Mock transcription: This is a simulated transcription of your audio input.');
    
    // Uncomment below for real OpenAI Whisper API integration:
    /*
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.transcription) {
        setTranscript(data.transcription);
      } else {
        setError('Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Failed to transcribe audio');
    }
    */
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startVoiceInput();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError('');
    setBrowserType('');
  };

  const isActive = isListening || isRecording;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Voice Input Test</h1>
        
        {/* Browser Info */}
        {browserType && (
          <div className="text-center mb-4 p-2 bg-blue-100 rounded">
            <span className="text-sm text-blue-800">
              {browserType === 'Firefox' ? '🦊 Firefox Mode (Recording)' : '🎤 Chrome Mode (Speech API)'}
            </span>
          </div>
        )}
        
        {/* Voice Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleButtonClick}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isActive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            {isRecording ? 'Recording... Click to stop (10s max)' : 
             isListening ? 'Listening... Speak now' : 
             'Click to start voice input'}
          </p>
        </div>

        {/* Transcript Display */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transcript:
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your speech will appear here..."
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Clear Button */}
        <button
          onClick={clearTranscript}
          className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Browser Support:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Chrome/Edge:</strong> Real-time speech recognition</li>
            <li><strong>Firefox:</strong> Audio recording + transcription</li>
            <li><strong>Safari:</strong> Limited speech recognition</li>
          </ul>
          <p className="mt-2"><strong>Note:</strong> Firefox mode uses mock transcription. Integrate with OpenAI Whisper API for real transcription.</p>
        </div>
      </div>
    </div>
  );
}
