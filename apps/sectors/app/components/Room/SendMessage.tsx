import React, { useState, useEffect } from "react";
import { Textarea } from "@nextui-org/react";
import Button from "@sectors/app/components/General/DebounceButton";
import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

interface SendMessageProps {
  onSendMessage: (message: string) => void;
  setShowAtList?: React.Dispatch<React.SetStateAction<boolean>>;
  setCaretPosition?: React.Dispatch<React.SetStateAction<number>>;
}

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const SendMessage: React.FC<SendMessageProps> = ({
  onSendMessage,
  setShowAtList,
  setCaretPosition,
}) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
      setShowAtList && setShowAtList(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const censor = new TextCensor();
    const matches = matcher.getAllMatches(input);
    setMessage(censor.applyTo(input, matches));

    const cursorPos = e.target.selectionStart;
    if (cursorPos == null) {
      return;
    }
    setCaretPosition && setCaretPosition(cursorPos);

    const lastChar = input[cursorPos - 2];
    if (setShowAtList) {
      if (input[cursorPos - 1] === "@" && (!lastChar || lastChar === " ")) {
        setShowAtList(true);
      } else {
        setShowAtList(false);
      }
    }
  };

  return (
    <div className="relative flex items-center p-4 bg-background grow">
      <Textarea
        placeholder="Type your message..."
        value={message}
        onChange={handleChange}
        onKeyDown={
          handleKeyDown as unknown as React.KeyboardEventHandler<HTMLInputElement>
        }
      />
      <Button color="primary" onClick={handleSendMessage} className="ml-2">
        Send
      </Button>
    </div>
  );
};

export default SendMessage;
