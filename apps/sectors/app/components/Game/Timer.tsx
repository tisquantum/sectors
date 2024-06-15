import { CircularProgress } from "@nextui-org/react";
import { useEffect, useState } from "react";

interface TimerProps {
  countdownTime?: number;
  onEnd?: () => void;
}

const Timer: React.FC<TimerProps> = ({ countdownTime = 10, onEnd }) => {
  const [value, setValue] = useState(countdownTime);

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
        svg: "w-36 h-36 drop-shadow-md",
        indicator: "stroke-white",
        track: "stroke-white/10",
        value: "text-3xl font-semibold text-white",
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
