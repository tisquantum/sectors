import React, { useState } from 'react';
import { Textarea } from '@nextui-org/react';
import Button from "@sectors/app/components/General/DebounceButton";
interface SendMessageProps {
  onSendMessage: (message: string) => void;
}

const SendMessage: React.FC<SendMessageProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() !== '') {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center p-4 bg-gray-200">
      <Textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler<HTMLInputElement>}
      />
      <Button color="primary" onClick={handleSendMessage} className="ml-2">
        Send
      </Button>
    </div>
  );
};

export default SendMessage;
