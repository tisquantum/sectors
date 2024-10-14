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
import { RiFundsFill } from "@remixicon/react";
import { useState, useMemo, memo } from "react";
import { User } from "@server/prisma/prisma.client";

// Extracted CommonNavLinks to receive props for the "onOpen" function
const CommonNavLinks = memo(() => (
  <>
    <NavbarItem>
      <Link href="/rooms">Rooms</Link>
    </NavbarItem>
    <NavbarItem>
      <Link href="/leaderboard">Leaderboard</Link>
    </NavbarItem>
    <NavbarItem>
      <Link href="https://rules.sectors.gg" target="_blank">
        Rules
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
          <Link href="/account/login">
            <DebounceButton>Log in</DebounceButton>
          </Link>
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
      <Navbar isBordered onMenuOpenChange={setIsMenuOpen}>
        <NavbarBrand>
          <Link href="/">
            <div className="flex gap-1 justify-center content-center items-center text-slate-100">
              <span>SECTORS</span>
              <RiFundsFill color="#17a34a" />
            </div>
          </Link>
        </NavbarBrand>

        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="visible md:invisible"
        />

        {/* Mobile Menu */}
        <NavbarMenu className="visible md:invisible">
          <CommonNavLinks />
          <NavbarMenuItem>{/* <ThemeSwitcher /> */}</NavbarMenuItem>
          {MemoizedAuthMenu}
        </NavbarMenu>

        {/* Desktop Menu */}
        <NavbarContent className="invisible md:visible hidden md:flex">
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
