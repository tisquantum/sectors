"use client";

import {
  Navbar,
  Link,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/react";
import { useAuthUser } from "./AuthUser.context";
import ThemeSwitcher from "./ThemeSwitcher";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { createClient } from "@sectors/utils/supabase/client";
import { useRouter } from "next/navigation";
import UserAvatar from "./Room/UserAvatar";
import { RiDiscordFill, RiFundsFill } from "@remixicon/react";
import { useState, useMemo, memo } from "react";
import { User } from "@server/prisma/prisma.client";
import { HandshakeIcon } from "lucide-react";
import Image from "next/image";

// Extracted CommonNavLinks to receive props for the "onOpen" function
const CommonNavLinks = memo(() => (
  <>
    <NavbarItem>
      <Link
        href="/rooms"
        className="text-white hover:bg-gray-800 hover:text-primary-400 px-3 py-2 rounded-md transition duration-300"
      >
        Rooms
      </Link>
    </NavbarItem>
    <NavbarItem>
      <Link
        href="/leaderboard"
        className="text-white hover:bg-gray-800 hover:text-primary-400 px-3 py-2 rounded-md transition duration-300"
      >
        Leaderboard
      </Link>
    </NavbarItem>
    <NavbarItem>
      <Link
        href="https://rules.sectors.gg"
        target="_blank"
        className="text-white hover:bg-gray-800 hover:text-primary-400 px-3 py-2 rounded-md transition duration-300"
      >
        Sectors Rules
      </Link>
    </NavbarItem>
    <NavbarItem>
      <Link
        href="/rules/executives"
        target="_blank"
        className="text-white hover:bg-gray-800 hover:text-primary-400 px-3 py-2 rounded-md transition duration-300"
      >
        The Executives Rules
      </Link>
    </NavbarItem>
    <NavbarItem className="flex items-center cursor-pointer">
      <Link
        href={process.env.NEXT_PUBLIC_DISCORD_LINK}
        target="_blank"
        className="text-gray-200 hover:text-primary-400 transition-transform transform hover:scale-110 p-2"
      >
        <RiDiscordFill className="text-2xl" />
      </Link>
    </NavbarItem>
    <NavbarItem className="flex items-center cursor-pointer">
      <Link
        href={process.env.NEXT_PUBLIC_BGG_LINK}
        target="_blank"
        className="p-2 h-[24px] w-[50px] rounded-medium bg-gray-100 hover:bg-primary-400 transition duration-300"
      >
        <Image
          src="/icons/board-game-geek-logo.svg"
          alt="board-game-geek-logo"
          width={45}
          height={75}
          layout="intrinsic"
          className="filter drop-shadow-lg transition-transform transform hover:scale-105"
        />
      </Link>
    </NavbarItem>
  </>
));

CommonNavLinks.displayName = "CommonNavLinks";

// Extracted AuthMenu component outside to prevent unnecessary re-renders
const AuthMenu = memo(
  ({
    loading,
    user,
    handleLogout,
  }: {
    loading: boolean;
    user: User | null;
    handleLogout: () => void;
  }) => {
    return (
      <NavbarItem>
        {loading ? (
          <Button>Loading...</Button>
        ) : user ? (
          <Dropdown className="bg-primary">
            <DropdownTrigger>
              <Button>
                <UserAvatar user={user} size="sm" /> {user.name}
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem href="/account/settings">Settings</DropdownItem>
              <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <div className="flex gap-1">
            <Link href="/account/login">
              <DebounceButton>Log in</DebounceButton>
            </Link>
            <Link href="/account/sign-up">
              <DebounceButton>Sign Up</DebounceButton>
            </Link>
          </div>
        )}
      </NavbarItem>
    );
  }
);

AuthMenu.displayName = "AuthMenu";

const TopBar = () => {
  const { user, loading } = useAuthUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/account/login");
  };

  // Memoize dropdown content to prevent unnecessary re-renders
  const MemoizedAuthMenu = useMemo(
    () => (
      <AuthMenu loading={loading} user={user} handleLogout={handleLogout} />
    ),
    [loading, user]
  );

  return (
    <>
      <Navbar isBordered shouldHideOnScroll onMenuOpenChange={setIsMenuOpen}>
        <NavbarBrand>
          <Link href="/">
            <div className="flex flex-col gap-1 hover:text-primary-400">
              <div className="flex gap-1 justify-center content-center items-center text-default-900">
                <span>SECTORS</span>
                <RiFundsFill color="#17a34a" />
              </div>
              <div className="flex gap-1 justify-center content-center items-center text-default-900">
                <span>THE EXECUTIVES</span>
                <HandshakeIcon color="#5072A7" />
              </div>
            </div>
          </Link>
        </NavbarBrand>

        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="visible lg:invisible"
        />

        {/* Mobile Menu */}
        <NavbarMenu className="visible lg:invisible">
          <CommonNavLinks />
          <NavbarMenuItem>{/* <ThemeSwitcher /> */}</NavbarMenuItem>
          {MemoizedAuthMenu}
        </NavbarMenu>

        {/* Desktop Menu */}
        <NavbarContent className="invisible lg:visible hidden lg:flex">
          <CommonNavLinks />
          {MemoizedAuthMenu}
          {/* <NavbarItem className="invisible md:visible">
            <ThemeSwitcher />
          </NavbarItem> */}
        </NavbarContent>
      </Navbar>
    </>
  );
};

export default TopBar;
