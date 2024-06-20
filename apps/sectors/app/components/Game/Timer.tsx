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

  return (
    <CircularProgress
      classNames={{
        svg: `w-${size} h-${size} drop-shadow-md`,
        indicator: "stroke-white",
        track: "stroke-white/10",
        value: `text-${textSize}xl font-semibold text-white`,
      }}
      aria-label="Loading..."
      value={(value / countdownTime) * 100}
      color="warning"
      showValueLabel={true}
      valueLabel={`${value}s`}
    />
  );
};

export default Timer;
