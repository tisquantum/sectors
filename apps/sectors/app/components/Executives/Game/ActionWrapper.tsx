import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { RiCheckFill, RiCloseFill } from "@remixicon/react";
import { ReactNode, useState } from "react";

export const ActionWrapper = ({
  acceptCallback,
  children,
  optionsNode,
}: {
  acceptCallback: () => Promise<void> | void;
  children: ReactNode;
  optionsNode?: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptCallback();
    } finally {
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <div
          className="flex flex-col gap-2 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <Spinner />
          ) : (
            <>
              <div className="flex flex-row items-center justify-center gap-2 p-2">
                <Button color="success" onPress={handleAccept} isIconOnly>
                  <RiCheckFill />
                </Button>
                <Button color="warning" onPress={handleClose} isIconOnly>
                  <RiCloseFill />
                </Button>
              </div>
              {optionsNode}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
