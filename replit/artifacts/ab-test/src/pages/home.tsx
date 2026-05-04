import { useState, useEffect, useRef } from "react";
import { useCreateSession, useSubmitStep } from "@workspace/api-client-react";
import type { Session } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<number>(0);
  const [session, setSession] = useState<Session | null>(null);

  const createSession = useCreateSession();
  const submitStep = useSubmitStep();

  const handleStart = () => {
    createSession.mutate(
      { data: {} },
      {
        onSuccess: (data) => {
          setSession(data);
          setStep(1);
        },
      }
    );
  };

  const [countdown, setCountdown] = useState(5);
  const submitStepRef = useRef(submitStep.mutate);
  submitStepRef.current = submitStep.mutate;

  useEffect(() => {
    if (step === 1 && session) {
      setCountdown(5);
      const sessionId = session.id;
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitStepRef.current(
              { sessionId, data: { step: 1 } },
              {
                onSuccess: (updatedSession) => {
                  setSession(updatedSession);
                  setStep(2);
                },
              }
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session?.id]);

  const [freeText, setFreeText] = useState("");

  const handleStep2Submit = () => {
    if (!session) return;
    submitStep.mutate(
      { sessionId: session.id, data: { step: 2, answer: freeText } },
      {
        onSuccess: (updatedSession) => {
          setSession(updatedSession);
          setStep(3);
        },
      }
    );
  };

  const [selectedOption, setSelectedOption] = useState("");

  const handleStep3Submit = () => {
    if (!session) return;
    submitStep.mutate(
      { sessionId: session.id, data: { step: 3, answer: selectedOption } },
      {
        onSuccess: (updatedSession) => {
          setSession(updatedSession);
          setStep(4);
        },
      }
    );
  };

  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 shadow-sm border-border">
          <h1 className="text-2xl font-semibold mb-4 text-slate-900">Welcome</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            You will see a webpage design for 5 seconds, then answer 2 quick questions. The whole thing takes about a minute.
          </p>
          <Button
            className="w-full h-12 text-base font-medium"
            onClick={handleStart}
            disabled={createSession.isPending}
          >
            {createSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I am Ready to Start
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 1 && session) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <img
          src="/landing-page-a.png"
          alt="Webpage Design"
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute bottom-12 text-white font-mono text-7xl font-bold opacity-80 select-none">
          {countdown > 0 ? countdown : 0}
        </div>
      </div>
    );
  }

  if (step === 2 && session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-xl w-full p-8 shadow-sm">
          <div className="mb-8">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">Question 1 of 2</span>
            <h2 className="text-xl font-medium text-slate-900">
              In which area of business do you think the company with this webpage is working?
            </h2>
          </div>
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="min-h-[160px] resize-none mb-6 text-base p-4"
            placeholder="Type your answer here..."
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              onClick={handleStep2Submit}
              disabled={!freeText.trim() || submitStep.isPending}
              className="px-8 h-12"
            >
              {submitStep.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 3 && session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-xl w-full p-8 shadow-sm">
          <div className="mb-8">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">Question 2 of 2</span>
            <h2 className="text-xl font-medium text-slate-900">
              Which of the following best describes the company's industry?
            </h2>
          </div>
          
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-3 mb-8">
            {session.multipleChoiceOptions?.map((option) => (
              <div key={option} className="flex items-center space-x-3 border border-slate-200 p-4 rounded-md hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedOption(option)}>
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base leading-none font-normal text-slate-700">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-end">
            <Button
              onClick={handleStep3Submit}
              disabled={!selectedOption || submitStep.isPending}
              className="px-8 h-12"
            >
              {submitStep.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full p-10 text-center shadow-sm border-t-4 border-t-primary">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-slate-900">Thank you</h2>
          <p className="text-slate-600">
            Your responses have been recorded successfully. You may close this window.
          </p>
        </Card>
      </div>
    );
  }

  return null;
}
