import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const getBotResponse = (message: string, userRole: string) => {
  const lowerMessage = message.toLowerCase();

  // Common responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! How can I help you with e-waste management today?`;
  }

  // Role-specific responses
  switch (userRole) {
    case 'USER':
      if (lowerMessage.includes('pickup')) {
        return 'To schedule a pickup, click the "Request Pickup" button on your dashboard. A recycler will be assigned to collect your e-waste.';
      }
      if (lowerMessage.includes('repair')) {
        return 'For repairs, use the "Request Repair" option. You can select a technician and describe your device issue.';
      }
      break;

    case 'TECHNICIAN':
      if (lowerMessage.includes('repair')) {
        return 'You can view and manage repair requests assigned to you in your dashboard. Remember to update the status as you progress.';
      }
      if (lowerMessage.includes('marketplace')) {
        return 'After completing repairs, you can list refurbished items in the marketplace using the "List in Marketplace" button.';
      }
      break;

    case 'RECYCLER':
      if (lowerMessage.includes('pickup')) {
        return 'Check your dashboard for new pickup requests. Make sure to update the status and record the carbon impact.';
      }
      break;
  }

  return "I'm here to help with e-waste management. You can ask about pickups, repairs, or the marketplace.";
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Hello! How can I assist you today?', sender: 'bot' as const }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: 'user' as const };
    const botMessage: Message = { 
      text: getBotResponse(input, user?.role || 'USER'), 
      sender: 'bot' as const 
    };

    setMessages([...messages, userMessage, botMessage]);
    setInput('');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed right-4 shadow-lg transition-all duration-300 ${
      isMinimized ? 'bottom-4 h-12' : 'bottom-4 h-[450px]'
    } w-80`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">E-Waste Assistant</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <Button onClick={handleSend}>Send</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}