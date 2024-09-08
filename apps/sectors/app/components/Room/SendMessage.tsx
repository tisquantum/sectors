import React, { useState, useEffect, forwardRef } from "react";
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
  controlledMessage?: string;
  setControlledMessage?: React.Dispatch<React.SetStateAction<string>>;
}

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const SendMessage = forwardRef<HTMLTextAreaElement, SendMessageProps>(
  (
    {
      onSendMessage,
      setShowAtList,
      setCaretPosition,
      controlledMessage,
      setControlledMessage,
    },
    ref
  ) => {
    const [message, setMessage] = useState("");

    const handleSendMessage = () => {
      const messageToSend =
        controlledMessage != undefined ? controlledMessage : message;
      if (messageToSend.trim() !== "") {
        onSendMessage(messageToSend);
        setControlledMessage ? setControlledMessage("") : setMessage("");
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
      setControlledMessage
        ? setControlledMessage(censor.applyTo(input, matches))
        : setMessage(censor.applyTo(input, matches));
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
      <div className="relative flex items-center bg-background grow">
        <Textarea
          ref={ref}
          placeholder="Type your message..."
          value={controlledMessage != undefined ? controlledMessage : message}
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
  }
);

export default SendMessage;
