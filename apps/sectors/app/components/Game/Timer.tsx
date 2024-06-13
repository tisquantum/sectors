import { CircularProgress } from "@nextui-org/react";
import { useEffect, useState } from "react";

const Timer = () => {
  const [value, setValue] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((v) => (v <= 0 ? 10 : v - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <CircularProgress
      classNames={{
        svg: "w-36 h-36 drop-shadow-md",
        indicator: "stroke-white",
        track: "stroke-white/10",
        value: "text-3xl font-semibold text-white",
      }}
      aria-label="Loading..."
      value={(value / 10) * 100}
      color="warning"
      showValueLabel={true}
      valueLabel={`${value}s`}
    />
  );
};

export default Timer;
