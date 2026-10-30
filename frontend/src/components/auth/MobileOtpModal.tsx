"use client";

import React, { useState, useEffect } from "react";
import { Phone, ShieldCheck, CheckCircle2, RotateCcw, X, ArrowRight, Loader2 } from "lucide-react";

interface MobileOtpModalProps {
  isOpen: boolean;
  phoneNumber: string;
  onVerified: () => void;
  onClose: () => void;
}

export const MobileOtpModal: React.FC<MobileOtpModalProps> = ({
  isOpen,
  phoneNumber,
  onVerified,
  onClose,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      setError(null);
      setVerifiedSuccess(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const digits = pasted.split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
    }
  };

  const handleVerify = () => {
    const fullCode = otp.join("");
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 700);
    }, 800);
  };

  const handleAutoFillDemo = () => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-150"
    >
      <div className="bg-white rounded-3xl border border-brand-border max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-brand-charcoal transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-brand-surface text-brand-orange mx-auto flex items-center justify-center border-2 border-brand-orange/20">
            <Phone className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-charcoal">
            Verify Mobile Number
          </h2>
          <p className="text-xs text-brand-muted">
            We sent an SMS with a 6-digit verification OTP to:
          </p>
          <div className="inline-block px-3 py-1 bg-brand-surface border border-brand-border rounded-full text-xs font-black text-brand-charcoal">
            +91 {phoneNumber || "XXXXXXXXXX"}
          </div>
        </div>

        {/* Demo OTP auto-fill badge */}
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-amber-900 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Demo OTP Code: <strong>123456</strong></span>
          </span>
          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="text-[11px] font-black text-amber-800 hover:underline cursor-pointer uppercase"
          >
            Auto-Fill
          </button>
        </div>

        {/* 6 Digit Inputs */}
        <div className="space-y-3" onPaste={handlePaste}>
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-2xl border transition-all focus:outline-none ${
                  digit
                    ? "bg-brand-surface border-brand-orange ring-1 ring-brand-orange"
                    : "bg-white border-brand-border focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-brand-tomato text-center font-bold">{error}</p>
          )}
        </div>

        {/* Verify CTA */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || verifiedSuccess}
            className={`w-full py-3.5 rounded-full text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              verifiedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-brand-charcoal hover:bg-brand-orange text-white"
            }`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying SMS Code...</span>
              </>
            ) : verifiedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mobile Number Verified!</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-brand-muted pt-1">
            <span>Didn&apos;t receive code?</span>
            {timer > 0 ? (
              <span className="font-bold text-zinc-500">Resend in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTimer(30);
                  setError(null);
                }}
                className="font-bold text-brand-orange hover:underline cursor-pointer"
              >
                Resend SMS OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

