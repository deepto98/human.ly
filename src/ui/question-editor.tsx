import { useState } from "react";
import { Input } from "@/ui/input";
import { X, Plus, Check } from "lucide-react";
import { cn } from "@/utils/misc";

interface QuestionEditorProps {
  question?: {
    _id?: string;
    type: "mcq" | "subjective";
    questionText: string;
    marks: number;
    options?: string[];
    correctOption?: number;
    keyPoints?: string[];
  };
  onSave: (question: any) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [type, setType] = useState<"mcq" | "subjective">(question?.type || "mcq");
  const [questionText, setQuestionText] = useState(question?.questionText || "");
  const [marks, setMarks] = useState(question?.marks || 2);
  const [options, setOptions] = useState<string[]>(
    question?.options || ["Option A", "Option B", "Option C", "Option D"]
  );
  const [correctOption, setCorrectOption] = useState(question?.correctOption ?? 0);
  const [keyPoints, setKeyPoints] = useState<string[]>(
    question?.keyPoints || ["Key point 1", "Key point 2", "Key point 3"]
  );

  const handleSave = () => {
    if (!questionText.trim()) {
      alert("Please enter a question");
      return;
    }

    if (type === "mcq" && options.some(opt => !opt.trim())) {
      alert("All options must be filled");
      return;
    }

    if (type === "subjective" && keyPoints.some(kp => !kp.trim())) {
      alert("All key points must be filled");
      return;
    }

    onSave({
      _id: question?._id,
      type,
      questionText,
      marks,
      ...(type === "mcq" ? { options, correctOption } : { keyPoints }),
    });
  };

  return (
    <div className="relative">
      <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
      <div className="relative border-[4px] border-black bg-white p-6">
        <h3 className="text-2xl font-black mb-4 text-black">
          {question ? "Edit Question" : "Add New Question"}
        </h3>

        {/* Question Type */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold uppercase text-black">
            Question Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("mcq")}
              className="relative"
            >
              <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
              <div className={cn(
                "relative border-[3px] border-black p-3 font-bold uppercase",
                type === "mcq" ? "bg-cyan-400" : "bg-white hover:bg-gray-100"
              )}>
                MCQ
              </div>
            </button>
            <button
              onClick={() => setType("subjective")}
              className="relative"
            >
              <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
              <div className={cn(
                "relative border-[3px] border-black p-3 font-bold uppercase",
                type === "subjective" ? "bg-lime-400" : "bg-white hover:bg-gray-100"
              )}>
                Subjective
              </div>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold uppercase text-black">
            Question
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here..."
            rows={3}
            className="w-full border-[3px] border-black p-3 text-base resize-none bg-white text-black"
          />
        </div>

        {/* Marks */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold uppercase text-black">
            Marks
          </label>
          <Input
            type="number"
            min="1"
            value={marks}
            onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
            className="w-32"
          />
        </div>

        {/* MCQ Options */}
        {type === "mcq" && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold uppercase text-black">
              Options (select correct answer)
            </label>
            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrectOption(idx)}
                    className={cn(
                      "flex-shrink-0 h-6 w-6 border-[3px] border-black flex items-center justify-center",
                      correctOption === idx ? "bg-lime-400" : "bg-white"
                    )}
                  >
                    {correctOption === idx && <Check className="h-4 w-4" />}
                  </button>
                  <span className="font-bold w-6">{String.fromCharCode(65 + idx)}.</span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[idx] = e.target.value;
                      setOptions(newOptions);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subjective Key Points */}
        {type === "subjective" && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold uppercase text-black">
              Key Points for Evaluation
            </label>
            <div className="space-y-2">
              {keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-bold">•</span>
                  <Input
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...keyPoints];
                      newPoints[idx] = e.target.value;
                      setKeyPoints(newPoints);
                    }}
                    placeholder={`Key point ${idx + 1}`}
                    className="flex-1"
                  />
                  {keyPoints.length > 3 && (
                    <button
                      onClick={() => setKeyPoints(keyPoints.filter((_, i) => i !== idx))}
                      className="p-2 border-[2px] border-black hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {keyPoints.length < 8 && (
                <button
                  onClick={() => setKeyPoints([...keyPoints, ""])}
                  className="text-sm font-bold text-gray-600 hover:text-black"
                >
                  + Add key point
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="relative flex-1"
          >
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-orange-400 px-6 py-3 font-bold hover:bg-orange-500 transition-colors">
              Save Question
            </div>
          </button>
          <button
            onClick={onCancel}
            className="relative"
          >
            <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
            <div className="relative border-[3px] border-black bg-gray-200 px-6 py-3 font-bold hover:bg-gray-300 transition-colors">
              Cancel
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

