"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, CheckCircle2, Timer } from "lucide-react";

const VARIANT_IMAGES = {
  A: "https://ucarecdn.com/08d434d5-d494-49ba-a466-4bf1ac7926d0/-/format/auto/",
  B: "https://ucarecdn.com/08d434d5-d494-49ba-a466-4bf1ac7926d0/-/format/auto/", // Same image for now, can be replaced later
};

const MCQ_OPTIONS = [
  "Software Development",
  "Fashion & Apparel",
  "Real Estate",
  "Digital Marketing",
  "E-commerce Solutions",
];

export default function ExperimentPage() {
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState("intro"); // intro, viewing_image, free_text, multiple_choice, completed
  const [timeLeft, setTimeLeft] = useState(5);
  const [freeText, setFreeText] = useState("");
  const [mcqChoice, setMcqChoice] = useState("");
  const [randomizedOptions, setRandomizedOptions] = useState([]);

  // Shuffle MCQ options once per session
  useEffect(() => {
    if (currentStep === "multiple_choice") {
      const shuffled = [...MCQ_OPTIONS].sort(() => Math.random() - 0.5);
      setRandomizedOptions(shuffled);
    }
  }, [currentStep]);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/experiment/sessions", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to start experiment");
      return response.json();
    },
    onSuccess: (data) => {
      setSession(data);
      setCurrentStep("viewing_image");
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch(`/api/experiment/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save progress");
      return response.json();
    },
  });

  // Handle timer for image viewing
  useEffect(() => {
    let timer;
    if (currentStep === "viewing_image" && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (currentStep === "viewing_image" && timeLeft === 0) {
      updateSessionMutation.mutate({ current_step: "free_text" });
      setCurrentStep("free_text");
    }
    return () => clearTimeout(timer);
  }, [currentStep, timeLeft, updateSessionMutation]);

  const handleStart = () => createSessionMutation.mutate();

  const handleSubmitFreeText = () => {
    if (!freeText.trim()) return;
    updateSessionMutation.mutate({
      current_step: "multiple_choice",
      free_text_response: freeText,
    });
    setCurrentStep("multiple_choice");
  };

  const handleSubmitMcq = () => {
    if (!mcqChoice) return;
    updateSessionMutation.mutate({
      current_step: "completed",
      multiple_choice_response: mcqChoice,
    });
    setCurrentStep("completed");
  };

  if (createSessionMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- RENDERING LOGIC ---

  if (currentStep === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Landing Page Experiment
          </h1>
          <p className="text-gray-600">
            Welcome! This experiment will take about 1 minute.
            <br />
            <br />
            1. You will see a landing page for 5 seconds.
            <br />
            2. You will then answer two short questions about what you saw.
          </p>
          <button
            onClick={handleStart}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            I'm Ready to Start <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === "viewing_image") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <img
          src={VARIANT_IMAGES[session?.variant]}
          alt="Landing Page Preview"
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white flex items-center gap-2">
          <Timer className="w-4 h-4" />
          <span className="font-mono text-lg">{timeLeft}s</span>
        </div>
      </div>
    );
  }

  if (currentStep === "free_text") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-2 text-center">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
              Step 2 of 3
            </span>
            <h2 className="text-2xl font-bold text-gray-900">
              Quick Impression
            </h2>
            <p className="text-gray-500">Based on the image you just saw...</p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              In which area of business do you think this company works?
            </label>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              minLength={10}
            />
            <p className="text-xs text-gray-400">Min. 10 characters</p>
          </div>

          <button
            onClick={handleSubmitFreeText}
            disabled={freeText.length < 10 || updateSessionMutation.isPending}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {updateSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === "multiple_choice") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-2 text-center">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
              Step 3 of 3
            </span>
            <h2 className="text-2xl font-bold text-gray-900">One Last Thing</h2>
            <p className="text-gray-500">
              Pick the category that best fits the company you saw.
            </p>
          </div>

          <div className="space-y-3">
            {randomizedOptions.map((option) => (
              <button
                key={option}
                onClick={() => setMcqChoice(option)}
                className={`w-full p-4 text-left border rounded-xl transition-all ${
                  mcqChoice === option
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${mcqChoice === option ? "text-blue-700" : "text-gray-700"}`}
                  >
                    {option}
                  </span>
                  {mcqChoice === option && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitMcq}
            disabled={!mcqChoice || updateSessionMutation.isPending}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {updateSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit Experiment"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === "completed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Thank You!</h1>
          <p className="text-gray-600">
            Your response has been recorded. This information will help us
            improve our webpage design.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 font-medium hover:underline"
          >
            Take the experiment again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
