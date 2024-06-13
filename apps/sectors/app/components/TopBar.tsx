"use client";

import { Navbar, Button, Link, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react';
import { useAuthUser } from './AuthUser.context';
import ThemeSwitcher from './ThemeSwitcher';

const TopBar = () => {
  const { user, loading } = useAuthUser();
 
  return (
    <Navbar isBordered>
      <NavbarBrand>
        <Link href="#">
          Sectors
        </Link>
      </NavbarBrand>
      <NavbarContent>
        <NavbarItem><Link href="/rooms">Rooms</Link></NavbarItem>
      </NavbarContent>
      <NavbarContent>
        {loading ? (
          <NavbarItem>
            <Button>Loading...</Button>
          </NavbarItem>
        ) : user ? (
          <NavbarItem>
            <Button>Welcome, {user.name}</Button>
          </NavbarItem>
        ) : (
          <NavbarItem>
            <Button href="/login">
              Log in
            </Button>
          </NavbarItem>
        )}
        <ThemeSwitcher />
      </NavbarContent>
    </Navbar>
  );
};

export default TopBar;
