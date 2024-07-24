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
} from "@nextui-org/react";
import { useAuthUser } from "./AuthUser.context";
import ThemeSwitcher from "./ThemeSwitcher";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { createClient } from "@sectors/utils/supabase/client";
import { useRouter } from "next/navigation";
import UserAvatar from "./Room/UserAvatar";
import Rules from "./Game/Rules";

const TopBar = () => {
  const { user, loading } = useAuthUser();
  const supabase = createClient();
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    //redirect/refresh to login page
    router.push("/login");
  };
  return (
    <Navbar isBordered>
      <NavbarBrand>
        <Link href="#">Sectors</Link>
      </NavbarBrand>
      <NavbarContent>
        <NavbarItem>
          <Link href="/rooms">Rooms</Link>
        </NavbarItem>
        <NavbarItem>
          <>
            <Button onPress={onOpen}>Rules</Button>
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
                    <ModalBody className="overflow-y-scroll">
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
          </>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent>
        {loading ? (
          <NavbarItem>
            <Button>Loading...</Button>
          </NavbarItem>
        ) : user ? (
          <NavbarItem>
            <Dropdown>
              <DropdownTrigger>
                <Button>
                  <UserAvatar user={user} size="sm" /> {user.name}
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem href="/settings">Settings</DropdownItem>
                <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Link href="/login">
              <DebounceButton>Log in</DebounceButton>
            </Link>
          </NavbarItem>
        )}
        <ThemeSwitcher />
      </NavbarContent>
    </Navbar>
  );
};

export default TopBar;
