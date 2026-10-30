"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  MessageCircle,
  Phone,
  Send,
  X,
  ChefHat,
  Bike,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface MessageItem {
  id: string;
  sender: "customer" | "kitchen" | "rider";
  text: string;
  time: string;
}

interface OrderCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  shopName: string;
  shopPhone?: string;
  riderName?: string;
  riderPhone?: string;
  orderStatus: string;
}

export const OrderCommunicationModal: React.FC<OrderCommunicationModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  shopName,
  shopPhone = "9876543210",
  riderName = "Assigned Delivery Partner",
  riderPhone = "9876543211",
  orderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<"kitchen" | "rider">("kitchen");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Simulated in-memory message history (ephemeral)
  const [kitchenMessages, setKitchenMessages] = useState<MessageItem[]>([
    {
      id: "km-1",
      sender: "kitchen",
      text: `Namaste! Aapka order #${orderNumber} Bhukkad Verse kitchen ne accept kar liya hai. Koi special cooking instruction ho toh yahan likhein!`,
      time: "Just now",
    },
  ]);

  const [riderMessages, setRiderMessages] = useState<MessageItem[]>([
    {
      id: "rm-1",
      sender: "rider",
      text: `Namaste! Main aapka delivery partner (${riderName}) hoon. Jaise hi kitchen se khana pack hoga, main pickup karke nikalunga.`,
      time: "Just now",
    },
  ]);

  if (!isOpen) return null;

  const currentMessages = activeTab === "kitchen" ? kitchenMessages : riderMessages;

  const handleSendMessage = () => {
    if (!inputText.trim() || sending) return;

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (activeTab === "kitchen") {
      setKitchenMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setSending(true);

      // Simulate Kitchen confirmation
      setTimeout(() => {
        setSending(false);
        setKitchenMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            sender: "kitchen",
            text: "Ji bhaiya, instruction note kar liya hai! Bilkul fresh aur waise hi banayenge.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }, 1000);
    } else {
      setRiderMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setSending(true);

      // Simulate Rider confirmation
      setTimeout(() => {
        setSending(false);
        setRiderMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            sender: "rider",
            text: "Theek hai bhaiya, main location par aakar call karunga!",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }, 1000);
    }
  };

  const handleWhatsAppRedirect = () => {
    const targetPhone = activeTab === "kitchen" ? shopPhone : riderPhone;
    const targetRole = activeTab === "kitchen" ? shopName : riderName;
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone || "919876543210";

    const encodedMsg = encodeURIComponent(
      `*BHUKKAD VERSE — Order Live Chat*\nOrder: *#${orderNumber}*\nTo: *${targetRole}*\n\nHi! Main apne order ke baare me baat karna chahta hoon.`
    );
    window.open(`https://wa.me/${waNumber}?text=${encodedMsg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 bg-brand-charcoal text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Live Order Chat • Order #{orderNumber}
            </span>
          </div>

          <h2 className="text-lg font-black text-white mt-1">
            Real-Time Delivery Coordination
          </h2>

          {/* Recipient Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("kitchen")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "kitchen"
                  ? "bg-brand-orange text-white shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen ({shopName.split(" ")[0]})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rider")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "rider"
                  ? "bg-brand-orange text-white shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery Rider</span>
            </button>
          </div>
        </div>

        {/* Ephemeral Privacy Banner */}
        <div className="px-5 py-2 bg-brand-surface border-b border-brand-border flex items-center justify-between text-[10px] font-bold text-brand-muted shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ephemeral Privacy: Chats auto-purged 24 hrs post-delivery</span>
          </span>
          <button
            type="button"
            onClick={handleWhatsAppRedirect}
            className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-black cursor-pointer"
          >
            <MessageCircle className="w-3 h-3 fill-emerald-600 text-emerald-600" />
            <span>Open in WhatsApp</span>
          </button>
        </div>

        {/* Chat Messages Log */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 bg-[#faf9f6]">
          {currentMessages.map((msg) => {
            const isMe = msg.sender === "customer";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                    isMe
                      ? "bg-brand-orange text-white rounded-br-xs"
                      : "bg-white border border-brand-border text-brand-charcoal rounded-bl-xs"
                  }`}
                >
                  <p className="font-medium">{msg.text}</p>
                </div>
                <span className="text-[9px] font-bold text-brand-muted mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            );
          })}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-brand-muted italic">
              <Loader2 className="w-3 h-3 animate-spin text-brand-orange" />
              <span>
                {activeTab === "kitchen" ? "Kitchen is typing..." : "Rider is typing..."}
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2.5 bg-white border-t border-brand-border/60 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {activeTab === "kitchen" ? (
              <>
                <button
                  type="button"
                  onClick={() => setInputText("Bhaiya, please mirchi kam aur extra crispy rakhna!")}
                  className="px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange shrink-0 cursor-pointer"
                >
                  🌶️ Kam mirchi & crispy
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("Extra green chutney aur disposable spoons pack kar dena.")}
                  className="px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange shrink-0 cursor-pointer"
                >
                  🧅 Extra chutney & spoons
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("Bhaiya kitni der me ready ho jayega?")}
                  className="px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange shrink-0 cursor-pointer"
                >
                  ⏱️ Kitna time lagega?
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setInputText("Main gate pe aakar call karna, doorbell mat bajana.")}
                  className="px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange shrink-0 cursor-pointer"
                >
                  📞 Call karna, bell mat bajana
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("Lift kharab hai, please 2nd floor pe aana.")}
                  className="px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange shrink-0 cursor-pointer"
                >
                  🏢 2nd floor doorstep
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("Delivery OTP ready hai.")}
                  className="px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-charcoal hover:border-brand-orange shrink-0 cursor-pointer"
                >
                  🔐 OTP Ready
                </button>
              </>
            )}
          </div>
        </div>

        {/* Input Composer */}
        <div className="p-4 bg-white border-t border-brand-border flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              activeTab === "kitchen"
                ? "Message the chef with cooking notes..."
                : "Message the delivery partner with directions..."
            }
            className="flex-1 px-4 py-2.5 rounded-full bg-brand-surface border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange/30 text-xs text-brand-charcoal font-medium"
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-full bg-brand-orange hover:bg-brand-tomato text-white flex items-center justify-center transition-colors shadow-xs shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
