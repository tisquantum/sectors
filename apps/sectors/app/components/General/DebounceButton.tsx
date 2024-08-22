import { Button, ButtonProps, Spinner } from "@nextui-org/react";
import { debounce, throttle } from "lodash";
import { useCallback, useMemo, useState } from "react";

type DebounceButtonProps = ButtonProps & {
  debounceDelay?: number;
  throttleDelay?: number;
  isLoading?: boolean;
};

const DebounceButton = ({
  debounceDelay = 300,
  throttleDelay = 300,
  onClick,
  isLoading = false,
  ...props
}: DebounceButtonProps) => {
  const handleClick = useCallback(
    async (event: any) => {
      if (onClick) {
        await onClick(event);
      }
    },
    [onClick]
  );

  const debouncedClick = useMemo(() => {
    if (debounceDelay !== undefined) {
      return debounce(handleClick, debounceDelay);
    }
    return handleClick;
  }, [handleClick, debounceDelay]);

  const throttledClick = useMemo(() => {
    if (throttleDelay !== undefined) {
      return throttle(debouncedClick, throttleDelay);
    }
    return debouncedClick;
  }, [debouncedClick, throttleDelay]);

  return (
    <Button {...props} onPress={throttledClick} disabled={isLoading}>
      {isLoading ? <Spinner /> : props.children}
    </Button>
  );
};

export default DebounceButton;
