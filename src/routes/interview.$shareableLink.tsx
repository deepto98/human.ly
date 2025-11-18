import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvexMutation, useConvexAction, convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { Input } from "@/ui/input";
import { Loader2, Video, Monitor, Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/utils/misc";
import Webcam from "react-webcam";
import RecordRTC from "recordrtc";

export const Route = createFileRoute("/interview/$shareableLink")({
  component: InterviewPage,
});

type InterviewState = "setup" | "permissions" | "active" | "completed";

interface Question {
  _id: string;
  type: "mcq" | "subjective";
  questionText: string;
  order: number;
  marks: number;
  options?: string[];
}

function InterviewPage() {
  const { shareableLink } = Route.useParams();
  
  const { data: agentData } = useQuery(
    convexQuery(api.agents.getAgentByLink, { shareableLink })
  );
  
  const startInterview = useConvexMutation(api.interviews.startInterview);
  const submitAnswer = useConvexAction(api.interviews.submitAnswer);
  const submitIntro = useConvexMutation(api.interviews.submitIntro);
  const submitFollowUpAnswer = useConvexMutation(api.interviews.submitFollowUpAnswer);
  const generateFollowUp = useConvexAction(api.interviews.generateFollowUp);
  const completeInterview = useConvexMutation(api.interviews.completeInterview);
  const uploadRecording = useConvexAction(api.interviews.uploadRecording);
  
  const [state, setState] = useState<InterviewState>("setup");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateIntro, setCandidateIntro] = useState("");
  
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [currentFollowUpQuestion, setCurrentFollowUpQuestion] = useState<string | null>(null);
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Array<{ sender: "agent" | "candidate"; text: string }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const webcamRef = useRef<Webcam>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [webcamRecorder, setWebcamRecorder] = useState<RecordRTC | null>(null);
  const [screenRecorder, setScreenRecorder] = useState<RecordRTC | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isIntroQuestion = currentQuestionIndex === -1;

  // Request permissions and show video feeds
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      setMediaStream(stream);
      setScreenStream(screenStream);
      setHasPermissions(true);

      // Start recording
      if (webcamVideoRef.current && screenVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        screenVideoRef.current.srcObject = screenStream;
        
        // Start audio analysis for mic animation
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // Start recording webcam
        const webcamRec = new RecordRTC(stream, {
          type: "video",
          mimeType: "video/webm;codecs=vp8,opus",
        });
        webcamRec.startRecording();
        setWebcamRecorder(webcamRec);
        
        // Start recording screen
        const screenRec = new RecordRTC(screenStream, {
          type: "video",
          mimeType: "video/webm;codecs=vp8,opus",
        });
        screenRec.startRecording();
        setScreenRecorder(screenRec);

        // Monitor audio levels for mic animation
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            requestAnimationFrame(updateAudioLevel);
          }
        };
        updateAudioLevel();
      }
      
      // Start interview immediately after permissions
      await handleStartInterview();
    } catch (error) {
      console.error("Permission denied:", error);
      alert("Camera and screen sharing permissions are required for this interview.");
    }
  };

  // Text-to-speech for agent
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech recognition for candidate with mic animation
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          if (isIntroQuestion) {
            setCandidateIntro(prev => prev + ' ' + finalTranscript);
          } else if (awaitingFollowUp) {
            setFollowUpAnswer(prev => prev + ' ' + finalTranscript);
          } else {
            setCurrentAnswer(prev => prev + ' ' + finalTranscript);
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Start interview - create interview session and go directly to active state
  const handleStartInterview = async () => {
    if (!candidateName.trim() || !candidateEmail.trim()) {
      alert("Please enter your name and email");
      return;
    }

    const result = await startInterview({
      agentId: agentData?._id as any,
      candidateName,
      candidateEmail,
    });

    setInterviewId(result.interviewId as string);
    setQuestions(result.questions as Question[]);
    
    // Go directly to active interview
    setState("active");
    setCurrentQuestionIndex(-1); // -1 means intro question
    
    // Agent introduction
    const introMessage = `Hello ${candidateName}! I'm ${agentData?.name}, and I'll be conducting your interview today. Before we begin with the questions, please tell me a bit about yourself.`;
    setMessages([{ sender: "agent", text: introMessage }]);
    speak(introMessage);
  };

  // Submit candidate intro
  const handleSubmitIntro = async () => {
    if (!candidateIntro.trim() || !interviewId) return;
    
    setMessages(prev => [...prev, { sender: "candidate", text: candidateIntro }]);
    
    // Save intro to backend
    await submitIntro({
      interviewId: interviewId as any,
      candidateIntro,
    });
    
    // Agent acknowledges and starts first question
    const acknowledgeText = "Thank you for sharing! Let's begin with the first question.";
    setMessages(prev => [...prev, { sender: "agent", text: acknowledgeText }]);
    speak(acknowledgeText);
    
    // Move to first question
    setCurrentQuestionIndex(0);
    setTimeout(() => {
      askNextQuestion();
    }, 2000);
  };

  // Ask next question
  const askNextQuestion = () => {
    if (currentQuestionIndex < questions.length && currentQuestionIndex >= 0) {
      const q = questions[currentQuestionIndex];
      const questionText = `Question ${currentQuestionIndex + 1}: ${q.questionText}`;
      setMessages(prev => [...prev, { sender: "agent", text: questionText }]);
      speak(questionText);
      setLastQuestionId(q._id);
      setFollowUpCount(0);
      setAwaitingFollowUp(false);
      setCurrentFollowUpQuestion(null);
    } else if (currentQuestionIndex >= questions.length) {
      // Interview complete
      finishInterview();
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!interviewId || !currentQuestion || awaitingFollowUp) return;

    const answer = currentQuestion.type === "mcq" 
      ? selectedOption?.toString() || ""
      : currentAnswer;

    if (!answer.trim() && currentQuestion.type === "subjective") return;
    if (selectedOption === null && currentQuestion.type === "mcq") return;

    // Add candidate's answer to messages
    const answerText = currentQuestion.type === "mcq"
      ? currentQuestion.options![selectedOption!]
      : answer;
    setMessages(prev => [...prev, { sender: "candidate", text: answerText }]);

    // Evaluate answer (don't show correct/incorrect to candidate)
    const result = await submitAnswer({
      interviewId: interviewId as any,
      questionId: currentQuestion._id as any,
      candidateAnswer: answer,
    });

    // For subjective questions, check if we should ask follow-up
    if (currentQuestion.type === "subjective" && agentData?.enableFollowUps && 
        followUpCount < (agentData.maxFollowUps || 2)) {
      
      // Generate interactive follow-up
      const followUp = await generateFollowUp({
        questionId: currentQuestion._id as any,
        candidateAnswer: answer,
      });

      setCurrentFollowUpQuestion(followUp as string);
      setMessages(prev => [...prev, { sender: "agent", text: followUp as string }]);
      speak(followUp as string);
      setAwaitingFollowUp(true);
      setFollowUpCount(prev => prev + 1);
      setFollowUpAnswer("");
      return;
    }

    // Move to next question (no feedback shown to candidate)
    setCurrentAnswer("");
    setSelectedOption(null);
    setCurrentQuestionIndex(prev => prev + 1);
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        askNextQuestion();
      } else {
        finishInterview();
      }
    }, 1000);
  };

  // Submit follow-up answer
  const handleSubmitFollowUp = async () => {
    if (!followUpAnswer.trim() || !lastQuestionId || !interviewId || !currentFollowUpQuestion) return;

    setMessages(prev => [...prev, { sender: "candidate", text: followUpAnswer }]);

    // Save follow-up question and answer
    await submitFollowUpAnswer({
      interviewId: interviewId as any,
      questionId: lastQuestionId as any,
      followUpQuestion: currentFollowUpQuestion,
      followUpAnswer: followUpAnswer,
    });

    // Check if more follow-ups or move on
    if (agentData?.enableFollowUps && followUpCount < (agentData.maxFollowUps || 2)) {
      // Generate another follow-up
      const followUp = await generateFollowUp({
        questionId: lastQuestionId as any,
        candidateAnswer: followUpAnswer,
      });

      setCurrentFollowUpQuestion(followUp as string);
      setMessages(prev => [...prev, { sender: "agent", text: followUp as string }]);
      speak(followUp as string);
      setFollowUpAnswer("");
      setFollowUpCount(prev => prev + 1);
    } else {
      // Move to next question
      setAwaitingFollowUp(false);
      setCurrentFollowUpQuestion(null);
      setFollowUpAnswer("");
      setCurrentAnswer("");
      setSelectedOption(null);
      setCurrentQuestionIndex(prev => prev + 1);
      
      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          askNextQuestion();
        } else {
          finishInterview();
        }
      }, 1000);
    }
  };

  // Finish interview and upload recordings
  const finishInterview = async () => {
    const closingText = agentData?.conversationalStyle === "casual"
      ? "Great job! That's all the questions I have for you today. Thanks for your time!"
      : "Thank you for completing the interview. We appreciate your time and effort.";
    
    setMessages(prev => [...prev, { sender: "agent", text: closingText }]);
    speak(closingText);

    // Stop recordings and upload
    if (webcamRecorder && screenRecorder && interviewId) {
      webcamRecorder.stopRecording(async () => {
        const webcamBlob = webcamRecorder.getBlob();
        const webcamBuffer = await webcamBlob.arrayBuffer();
        
        screenRecorder.stopRecording(async () => {
          const screenBlob = screenRecorder.getBlob();
          const screenBuffer = await screenBlob.arrayBuffer();
          
          // Combine recordings or upload separately
          // For now, upload webcam recording
          try {
            await uploadRecording({
              interviewId: interviewId as any,
              videoData: Array.from(new Uint8Array(webcamBuffer)),
              mimeType: "video/webm",
            });
          } catch (error) {
            console.error("Failed to upload recording:", error);
          }
        });
      });
    }

    // Stop media streams
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (interviewId) {
      await completeInterview({
        interviewId: interviewId as any,
      });
    }

    setState("completed");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!agentData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="text-2xl font-bold">Loading interview...</div>
      </div>
    );
  }

  // Setup State - Get candidate info
  if (state === "setup") {
    return (
      <div className="min-h-screen bg-amber-50 p-6 flex items-center justify-center">
        <div className="relative w-full max-w-2xl">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-8">
            <h1 className="mb-2 text-5xl font-black text-black">
              Welcome to Your Interview
            </h1>
            <p className="mb-8 text-lg text-gray-700 font-medium">
              You'll be interviewed by <span className="font-black">{agentData.name}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">
                  Your Name
                </label>
                <Input
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="John Doe"
                  className="border-[3px] border-black p-4 text-lg"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="border-[3px] border-black p-4 text-lg"
                />
              </div>
            </div>

            <button
              onClick={() => setState("permissions")}
              disabled={!candidateName.trim() || !candidateEmail.trim()}
              className="relative w-full group"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                Continue
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Permissions State - With live video feeds
  if (state === "permissions") {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2 items-center min-h-[80vh]">
            {/* Left: Ready to Start */}
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-white p-8">
                <h2 className="mb-4 text-4xl font-black text-black">
                  Ready to Start?
                </h2>
                <p className="mb-8 text-lg text-gray-700 font-medium">
                  This interview requires camera and screen sharing access for recording purposes.
                </p>

                <button
                  onClick={requestPermissions}
                  className="relative w-full group"
                >
                  <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                  <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                    <Video className="h-6 w-6" />
                    Grant Camera & Screen Access
                  </div>
                </button>
              </div>
            </div>

            {/* Right: Preview boxes */}
            <div className="space-y-4">
              {/* Webcam Preview */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-4">
                  <h3 className="mb-2 text-sm font-bold uppercase">Camera Preview</h3>
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-video w-full border-[2px] border-black bg-gray-200"
                  />
                </div>
              </div>

              {/* Screen Share Preview */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-4">
                  <h3 className="mb-2 text-sm font-bold uppercase">Screen Share Preview</h3>
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-video w-full border-[2px] border-black bg-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Interview State - Redesigned Layout
  if (state === "active") {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="mx-auto max-w-7xl">
          {/* Progress */}
          <div className="mb-6 relative">
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {isIntroQuestion ? "Introduction" : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                </span>
                <span className="font-bold">
                  Score: {/* Will track score */} / {agentData.totalMarks}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Left: Agent Visualization (Large) */}
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-gradient-to-br from-orange-300 to-orange-400 p-8 text-center min-h-[500px] flex flex-col items-center justify-center">
                <div className="mb-6">
                  <div className="h-32 w-32 rounded-full border-[4px] border-black bg-white flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                </div>
                <h3 className="text-3xl font-black mb-2">{agentData.name}</h3>
                <p className="text-lg font-bold uppercase">
                  {isSpeaking ? "🎤 Speaking..." : "Listening..."}
                </p>
                
                {/* Current Question Display (Only current question shown) */}
                {!isIntroQuestion && currentQuestion && (
                  <div className="mt-8 w-full max-w-2xl">
                    <div className="relative border-[3px] border-black bg-white p-6">
                      <h4 className="text-xl font-black mb-4">Current Question</h4>
                      <p className="text-lg font-medium mb-4">{currentQuestion.questionText}</p>
                      
                      {currentQuestion.type === "mcq" && currentQuestion.options && (
                        <div className="space-y-2">
                          {currentQuestion.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedOption(idx)}
                              className={cn(
                                "w-full text-left p-3 border-[2px] border-black font-medium transition-all",
                                selectedOption === idx ? "bg-orange-300" : "bg-gray-50 hover:bg-gray-100"
                              )}
                            >
                              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {currentQuestion.type === "subjective" && (
                        <div className="space-y-3">
                          <textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            rows={4}
                            className="w-full border-[2px] border-black p-3 text-base resize-none bg-white text-black"
                          />
                          <button
                            onClick={isListening ? stopListening : startListening}
                            className={cn(
                              "relative flex items-center justify-center gap-2 border-[2px] border-black px-4 py-2 font-bold uppercase w-full",
                              isListening ? "bg-red-300" : "bg-cyan-200 hover:bg-cyan-300"
                            )}
                          >
                            {isListening ? (
                              <>
                                <MicOff className="h-4 w-4" />
                                Stop Recording
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4" />
                                Speak Answer
                              </>
                            )}
                          </button>
                          {isListening && (
                            <div className="flex items-center gap-2 justify-center">
                              <Mic className={cn(
                                "h-6 w-6 transition-all",
                                audioLevel > 50 ? "animate-pulse" : "",
                                audioLevel > 100 ? "animate-bounce" : ""
                              )} style={{
                                transform: `scale(${1 + audioLevel / 200})`,
                                filter: `drop-shadow(0 0 ${audioLevel / 10}px rgba(239, 68, 68, 0.5))`
                              }} />
                              <span className="text-sm font-medium">Listening...</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {awaitingFollowUp && currentFollowUpQuestion && (
                        <div className="mt-4 pt-4 border-t-[2px] border-black">
                          <p className="text-lg font-medium mb-3">{currentFollowUpQuestion}</p>
                          <textarea
                            value={followUpAnswer}
                            onChange={(e) => setFollowUpAnswer(e.target.value)}
                            placeholder="Your response..."
                            rows={3}
                            className="w-full border-[2px] border-black p-3 text-base resize-none bg-white text-black mb-2"
                          />
                          <button
                            onClick={handleSubmitFollowUp}
                            disabled={!followUpAnswer.trim()}
                            className="relative w-full"
                          >
                            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                            <div className="relative flex items-center justify-center gap-2 border-[2px] border-black bg-lime-300 px-4 py-2 font-bold uppercase">
                              Submit Follow-up
                            </div>
                          </button>
                        </div>
                      )}
                      
                      {!awaitingFollowUp && (
                        <button
                          onClick={isIntroQuestion ? handleSubmitIntro : handleSubmitAnswer}
                          disabled={
                            isIntroQuestion ? !candidateIntro.trim() :
                            (currentQuestion.type === "mcq" && selectedOption === null) ||
                            (currentQuestion.type === "subjective" && !currentAnswer.trim())
                          }
                          className="relative w-full mt-4"
                        >
                          <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                          <div className="relative flex items-center justify-center gap-2 border-[2px] border-black bg-orange-400 px-6 py-3 font-bold uppercase">
                            <Send className="h-5 w-5" />
                            {isIntroQuestion ? "Submit Introduction" : "Submit Answer"}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Intro Question Display */}
                {isIntroQuestion && (
                  <div className="mt-8 w-full max-w-2xl">
                    <div className="relative border-[3px] border-black bg-white p-6">
                      <h4 className="text-xl font-black mb-4">Tell us about yourself</h4>
                      <textarea
                        value={candidateIntro}
                        onChange={(e) => setCandidateIntro(e.target.value)}
                        placeholder="Type or speak your introduction..."
                        rows={4}
                        className="w-full border-[2px] border-black p-3 text-base resize-none bg-white text-black mb-2"
                      />
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={cn(
                          "relative flex items-center justify-center gap-2 border-[2px] border-black px-4 py-2 font-bold uppercase w-full mb-2",
                          isListening ? "bg-red-300" : "bg-cyan-200 hover:bg-cyan-300"
                        )}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="h-4 w-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            Speak Introduction
                          </>
                        )}
                      </button>
                      {isListening && (
                        <div className="flex items-center gap-2 justify-center mb-2">
                          <Mic className={cn(
                            "h-6 w-6 transition-all",
                            audioLevel > 50 ? "animate-pulse" : "",
                            audioLevel > 100 ? "animate-bounce" : ""
                          )} style={{
                            transform: `scale(${1 + audioLevel / 200})`,
                            filter: `drop-shadow(0 0 ${audioLevel / 10}px rgba(239, 68, 68, 0.5))`
                          }} />
                          <span className="text-sm font-medium">Listening...</span>
                        </div>
                      )}
                      <button
                        onClick={handleSubmitIntro}
                        disabled={!candidateIntro.trim()}
                        className="relative w-full"
                      >
                        <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                        <div className="relative flex items-center justify-center gap-2 border-[2px] border-black bg-orange-400 px-6 py-3 font-bold uppercase">
                          <Send className="h-5 w-5" />
                          Submit Introduction
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Chat Transcript (Small YouTube-style) & Webcam */}
            <div className="space-y-4">
              {/* Chat Transcript */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-4">
                  <h3 className="mb-2 text-sm font-bold uppercase">Interview Chat</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-2 border-[2px] border-black text-sm font-medium",
                          msg.sender === "agent" ? "bg-cyan-100" : "bg-lime-100"
                        )}
                      >
                        <div className="text-xs font-bold uppercase mb-1">
                          {msg.sender === "agent" ? agentData.name : "You"}
                        </div>
                        <div className="text-xs">{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Webcam Feed */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-2">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="w-full border-[2px] border-black"
                  />
                  <p className="mt-1 text-xs font-bold text-center uppercase">Your Camera</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed State
  if (state === "completed") {
    return (
      <div className="min-h-screen bg-amber-50 p-6 flex items-center justify-center">
        <div className="relative w-full max-w-2xl">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-12 text-center">
            <div className="mb-6 mx-auto inline-block">
              <div className="relative">
                <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                <div className="relative border-[3px] border-black bg-lime-300 p-6 rounded-full">
                  <span className="text-6xl">✓</span>
                </div>
              </div>
            </div>

            <h1 className="mb-4 text-5xl font-black text-black">
              Interview Complete!
            </h1>
            <p className="mb-8 text-xl text-gray-700 font-medium">
              Thank you for your time. Your responses have been recorded.
            </p>

            <div className="text-4xl font-black mb-4">
              Your Score: Coming Soon
            </div>
            
            <p className="text-gray-600">
              The interviewer will review your responses and get back to you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
