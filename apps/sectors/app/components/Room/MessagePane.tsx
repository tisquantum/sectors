'use client';

import React, { useEffect, useRef } from 'react';
import MessageComponent from './Message';
import { RoomMessageWithUser } from '@server/prisma/prisma.types';

interface MessagePaneProps {
  messages: RoomMessageWithUser[];
}

const MessagePane: React.FC<MessagePaneProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the container whenever messages change
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={containerRef} className="bg-white p-4 overflow-y-scroll h-full">
      {messages.map((message) => (
        <div key={message.id}>
          <MessageComponent message={message} />
        </div>
      ))}
      <div ref={containerRef} /> {/* This ensures the last element is always in view */}
    </div>
  );
};

export default MessagePane;
