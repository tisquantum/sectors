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
} from "@nextui-org/react";
import { useAuthUser } from "./AuthUser.context";
import ThemeSwitcher from "./ThemeSwitcher";
import DebounceButton from "@sectors/app/components/General/DebounceButton";
import { createClient } from "@sectors/utils/supabase/client";
import { useRouter } from "next/navigation";
import UserAvatar from "./Room/UserAvatar";

const TopBar = () => {
  const { user, loading } = useAuthUser();
  const supabase = createClient();
  const router = useRouter();
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
