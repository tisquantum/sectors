// components/SendMessage.tsx
import React, { useState } from 'react';
import { Button, Textarea } from '@nextui-org/react';

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

  return (
    <div className="flex items-center p-4 bg-gray-200">
      <Textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button color="primary" onClick={handleSendMessage} className="ml-2">
        Send
      </Button>
    </div>
  );
};

export default SendMessage;
