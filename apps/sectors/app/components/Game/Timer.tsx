import { CircularProgress } from "@nextui-org/react";
import { useEffect, useState } from "react";

interface TimerProps {
  countdownTime?: number;
  size?: number;
  textSize?: number;
  onEnd?: () => void;
  startDate?: Date;
}

const Timer: React.FC<TimerProps> = ({ countdownTime = 10, size = 36, textSize = 3, onEnd, startDate }) => {
  const [value, setValue] = useState(countdownTime);

  useEffect(() => {
    if (startDate) {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);
      setValue(Math.max(countdownTime - elapsedSeconds, 0));
    } else {
      setValue(countdownTime);
    }
  }, [startDate, countdownTime]);

  useEffect(() => {
    if (value <= 0) {
      onEnd && onEnd();
      return;
    }

    const interval = setInterval(() => {
      setValue((v) => (v <= 0 ? countdownTime : v - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [value, countdownTime, onEnd]);

  // Determine color based on time remaining
  const getColor = () => {
    const percentage = (value / countdownTime) * 100;
    if (percentage <= 20) return "danger"; // Red when < 20% remaining
    if (percentage <= 40) return "warning"; // Yellow when < 40% remaining
    return "success"; // Green otherwise
  };

  return (
    <div className="flex flex-col items-center">
      <CircularProgress
        classNames={{
          svg: `w-${size} h-${size} drop-shadow-lg`,
          indicator: value <= countdownTime * 0.2 ? "stroke-red-500" : value <= countdownTime * 0.4 ? "stroke-yellow-500" : "stroke-green-500",
          track: "stroke-white/10",
          value: `text-${textSize}xl font-bold text-white drop-shadow-md`,
        }}
        aria-label="Phase timer"
        value={(value / countdownTime) * 100}
        color={getColor()}
        showValueLabel={true}
        valueLabel={`${value}s`}
      />
    </div>
  );
};

export default Timer;
