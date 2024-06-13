import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { Switch } from "@nextui-org/react";
import { useTheme } from "next-themes";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const isSelected = theme === "dark";

  //TODO: This is not working with custom themes yet.
  return (
    <Switch
      isSelected={isSelected}
      size="lg"
      color="success"
      startContent={<SunIcon />}
      endContent={<MoonIcon />}
      onChange={() => {
        setTheme(theme == "light" ? "dark" : "light");
      }}
    />
  );
};

export default ThemeSwitcher;
