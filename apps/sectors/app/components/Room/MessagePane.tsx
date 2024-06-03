// components/MessagePane.tsx
import React from 'react';
import MessageComponent from './Message';
import { RoomMessageWithUser } from '@server/prisma/prisma.types';

interface MessagePaneProps {
  messages: RoomMessageWithUser[];
}

const MessagePane: React.FC<MessagePaneProps> = ({ messages }) => {
  return (
    <div className="bg-white p-4 overflow-y-scroll h-full">
      {messages.map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessagePane;
