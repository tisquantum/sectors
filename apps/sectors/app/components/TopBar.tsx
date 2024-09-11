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
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
  ModalFooter,
  ModalHeader,
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
import Rules from "./Game/Rules";
import { RiFundsFill } from "@remixicon/react";
import { useState, useMemo, memo } from "react";
import { User } from "@server/prisma/prisma.client";

// Extracted CommonNavLinks to receive props for the "onOpen" function
const CommonNavLinks = memo(({ onOpen }: { onOpen: () => void}) => (
  <>
    <NavbarItem>
      <Link href="/rooms">Rooms</Link>
    </NavbarItem>
    <NavbarItem>
      <Link href="/leaderboard">Leaderboard</Link>
    </NavbarItem>
    <NavbarItem>
      <Button onPress={onOpen}>Rules</Button>
    </NavbarItem>
  </>
));

// Extracted AuthMenu component outside to prevent unnecessary re-renders
const AuthMenu = memo(({ loading, user, handleLogout }: {
  loading: boolean;
  user: User | null;
  handleLogout: () => void;
}) => {
  return (
    <NavbarItem>
      {loading ? (
        <Button>Loading...</Button>
      ) : user ? (
        <Dropdown>
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
});

const TopBar = () => {
  const { user, loading } = useAuthUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/account/login");
  };

  // Memoize dropdown content to prevent unnecessary re-renders
  const MemoizedAuthMenu = useMemo(
    () => <AuthMenu loading={loading} user={user} handleLogout={handleLogout} />,
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
          <CommonNavLinks onOpen={onOpen} />
          <NavbarMenuItem>
            <ThemeSwitcher />
          </NavbarMenuItem>
          {MemoizedAuthMenu}
        </NavbarMenu>

        {/* Desktop Menu */}
        <NavbarContent className="invisible md:visible hidden md:flex">
          <CommonNavLinks onOpen={onOpen} />
          {MemoizedAuthMenu}
          <NavbarItem className="invisible md:visible">
            <ThemeSwitcher />
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      {/* Conditionally rendering modal only when isOpen is true */}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          size="5xl"
          className="h-5/6"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold">Game Rules</h1>
                  </div>
                </ModalHeader>
                <ModalBody className="overflow-y-scroll scrollbar">
                  <Rules />
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="primary"
                    className="text-2xl"
                    variant="light"
                    onPress={onClose}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default TopBar;
