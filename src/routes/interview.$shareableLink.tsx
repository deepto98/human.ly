import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvexMutation, useConvexAction, convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, Video, Monitor, Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/utils/misc";
import Webcam from "react-webcam";

export const Route = createFileRoute("/interview/$shareableLink")({
  component: InterviewPage,
});

type InterviewState = "setup" | "permissions" | "intro" | "active" | "completed";

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
  const completeInterview = useConvexMutation(api.interviews.completeInterview);
  
  const [state, setState] = useState<InterviewState>("setup");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateIntro, setCandidateIntro] = useState("");
  
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const [messages, setMessages] = useState<Array<{ sender: "agent" | "candidate"; text: string }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Request permissions
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      // Also request screen share
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      
      setMediaStream(stream);
      setHasPermissions(true);
      setState("intro");
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

  // Speech recognition for candidate
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentAnswer(transcript);
      };
      
      recognition.start();
    }
  };

  // Start interview
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
    
    // Agent introduction
    const introMessage = `Hello ${candidateName}! I'm ${agentData?.name}, and I'll be conducting your interview today. Before we begin with the questions, please tell me a bit about yourself.`;
    setMessages([{ sender: "agent", text: introMessage }]);
    speak(introMessage);
  };

  // Submit candidate intro
  const handleSubmitIntro = () => {
    if (!candidateIntro.trim()) return;
    
    setMessages(prev => [...prev, { sender: "candidate", text: candidateIntro }]);
    
    // Agent acknowledges and starts first question
    const acknowledgeText = "Thank you for sharing! Let's begin with the first question.";
    setMessages(prev => [...prev, { sender: "agent", text: acknowledgeText }]);
    speak(acknowledgeText);
    
    setState("active");
    askNextQuestion();
  };

  // Ask next question
  const askNextQuestion = () => {
    if (currentQuestionIndex < questions.length) {
      const q = questions[currentQuestionIndex];
      const questionText = `Question ${currentQuestionIndex + 1}: ${q.questionText}`;
      setMessages(prev => [...prev, { sender: "agent", text: questionText }]);
      speak(questionText);
    } else {
      // Interview complete
      finishInterview();
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!interviewId || !currentQuestion) return;

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

    // Evaluate answer
    const result = await submitAnswer({
      interviewId: interviewId as any,
      questionId: currentQuestion._id as any,
      candidateAnswer: answer,
    });

    // Agent feedback
    const feedbackText = result.evaluationFeedback || "Noted. Let's move on.";
    setMessages(prev => [...prev, { sender: "agent", text: feedbackText }]);
    speak(feedbackText);

    // Reset and move to next
    setCurrentAnswer("");
    setSelectedOption(null);
    setCurrentQuestionIndex(prev => prev + 1);
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        askNextQuestion();
      } else {
        finishInterview();
      }
    }, 2000);
  };

  // Finish interview
  const finishInterview = async () => {
    const closingText = agentData?.conversationalStyle === "casual"
      ? "Great job! That's all the questions I have for you today. Thanks for your time!"
      : "Thank you for completing the interview. We appreciate your time and effort.";
    
    setMessages(prev => [...prev, { sender: "agent", text: closingText }]);
    speak(closingText);

    if (interviewId) {
      await completeInterview({
        interviewId: interviewId as any,
      });
    }

    setState("completed");
  };

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

  // Permissions State
  if (state === "permissions") {
    return (
      <div className="min-h-screen bg-amber-50 p-6 flex items-center justify-center">
        <div className="relative w-full max-w-2xl">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-8 text-center">
            <div className="mb-6 mx-auto inline-block">
              <div className="relative">
                <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                <div className="relative border-[3px] border-black bg-cyan-200 p-6">
                  <Video className="h-16 w-16 mx-auto" />
                </div>
              </div>
            </div>

            <h2 className="mb-4 text-4xl font-black text-black">
              Grant Permissions
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
                Grant Access
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Intro State - Ask candidate for introduction
  if (state === "intro") {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Webcam Preview */}
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-white p-4">
                <h3 className="mb-2 text-lg font-bold">Your Camera</h3>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="w-full border-[2px] border-black"
                />
              </div>
            </div>

            {/* Interview Start */}
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-white p-8">
                <h2 className="mb-4 text-3xl font-black">Ready to Start?</h2>
                <p className="mb-6 text-lg text-gray-700 font-medium">
                  Click below to begin your interview with {agentData.name}.
                </p>

                <button
                  onClick={handleStartInterview}
                  disabled={startInterview.isPending}
                  className="relative w-full group"
                >
                  <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                  <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                    {startInterview.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      "Start Interview"
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="relative mt-6">
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-white p-6">
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 border-[2px] border-black font-medium",
                        msg.sender === "agent" ? "bg-cyan-100" : "bg-lime-100"
                      )}
                    >
                      <div className="text-xs font-bold uppercase mb-1">
                        {msg.sender === "agent" ? agentData.name : "You"}
                      </div>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Intro Input */}
                <div className="space-y-3">
                  <Input
                    value={candidateIntro}
                    onChange={(e) => setCandidateIntro(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmitIntro()}
                    placeholder="Tell us about yourself..."
                    className="border-[3px] border-black p-4 text-lg"
                  />
                  <button
                    onClick={handleSubmitIntro}
                    disabled={!candidateIntro.trim()}
                    className="relative w-full group"
                  >
                    <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                    <div className="relative flex items-center justify-center gap-2 border-[3px] border-black bg-lime-300 px-6 py-3 font-bold uppercase transition-all hover:translate-x-[1px] hover:translate-y-[1px]">
                      <Send className="h-5 w-5" />
                      Submit
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Interview State
  if (state === "active") {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="mx-auto max-w-6xl">
          {/* Progress */}
          <div className="mb-6 relative">
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="font-bold">
                  Score: {/* Will track score */} / {agentData.totalMarks}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Avatar & Webcam */}
            <div className="space-y-4">
              {/* Agent Avatar */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-gradient-to-br from-orange-300 to-orange-400 p-8 text-center">
                  <div className="mb-3 mx-auto inline-block">
                    <div className="h-24 w-24 rounded-full border-[4px] border-black bg-white flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black">{agentData.name}</h3>
                  <p className="text-sm font-bold uppercase mt-1">
                    {isSpeaking ? "🎤 Speaking..." : "Listening..."}
                  </p>
                </div>
              </div>

              {/* Webcam */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-2">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="w-full border-[2px] border-black"
                  />
                  <p className="mt-2 text-xs font-bold text-center uppercase">Your Camera</p>
                </div>
              </div>
            </div>

            {/* Chat & Question Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Chat Messages */}
              <div className="relative">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-white p-6">
                  <h3 className="mb-4 text-xl font-bold">Interview Chat</h3>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 border-[2px] border-black font-medium",
                          msg.sender === "agent" ? "bg-cyan-100" : "bg-lime-100"
                        )}
                      >
                        <div className="text-xs font-bold uppercase mb-1">
                          {msg.sender === "agent" ? agentData.name : "You"}
                        </div>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Answer Input */}
              {currentQuestion && (
                <div className="relative">
                  <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                  <div className="relative border-[4px] border-black bg-white p-6">
                    <h3 className="mb-4 text-lg font-bold uppercase">Your Answer</h3>

                    {currentQuestion.type === "mcq" ? (
                      <div className="space-y-2 mb-4">
                        {currentQuestion.options?.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            className={cn(
                              "w-full text-left p-4 border-[3px] border-black font-medium transition-all",
                              selectedOption === idx ? "bg-orange-300" : "bg-white hover:bg-gray-100"
                            )}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4">
                        <textarea
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          rows={6}
                          className="w-full border-[3px] border-black p-4 text-lg resize-none bg-white text-black"
                        />
                        <button
                          onClick={startListening}
                          disabled={isListening}
                          className="relative"
                        >
                          <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                          <div className={cn(
                            "relative flex items-center gap-2 border-[3px] border-black px-4 py-2 font-bold uppercase",
                            isListening ? "bg-red-300" : "bg-cyan-200 hover:bg-cyan-300"
                          )}>
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {isListening ? "Listening..." : "Speak Answer"}
                          </div>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={
                        (currentQuestion.type === "mcq" && selectedOption === null) ||
                        (currentQuestion.type === "subjective" && !currentAnswer.trim())
                      }
                      className="relative w-full group"
                    >
                      <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                      <div className="relative flex items-center justify-center gap-2 border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
                        <Send className="h-6 w-6" />
                        Submit Answer
                      </div>
                    </button>
                  </div>
                </div>
              )}
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

