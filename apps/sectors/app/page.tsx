"use client";
import { RiFundsFill } from "@remixicon/react";
import { HandshakeIcon } from "lucide-react";
import { useAuthUser } from "./components/AuthUser.context";
import { Button, Link } from "@nextui-org/react";

export default function Home() {
  const { user } = useAuthUser();
  return (
    <div className="container mx-auto px-4 py-12 overflow-y-auto">
      <div className="mb-16">
        <div className="flex gap-2 justify-center items-center text-default-900 text-2xl mb-4">
          <span>SECTORS</span>
          <RiFundsFill color="#17a34a" />
        </div>
        <p className="text-lg text-default-900 text-center max-w-2xl mx-auto mb-8">
          Sectors is a financial game of stock manipulation where players are
          investors who will trade stocks and influence the decisions the
          companies they invest in make.
        </p>
        <p className="text-lg text-default-900 text-center max-w-2xl mx-auto mb-8">
          The winner is the player who collects the most money by the end of a
          set amount of turns or the bank breaks, whichever should happen first!
        </p>
        <div className="flex justify-center gap-8">
          <Button as={Link} href="https://rules.sectors.gg" target="_blank">
            Rules
          </Button>
        </div>
      </div>

      <div className="mb-16">
        <div className="flex gap-2 justify-center items-center text-default-900 text-2xl mb-4">
          <span>THE EXECUTIVES</span>
          <HandshakeIcon color="#5072A7" />
        </div>
        <p className="text-lg text-default-900 text-center max-w-2xl mx-auto mb-8">
          The Executives is a trick-taking game where players, as C-Suite
          executives, compete to take control of the company from the legacy
          CEO.
        </p>
        <p className="text-lg text-default-900 text-center max-w-2xl mx-auto mb-8">
          The game involves influence bidding, trick-taking, and concludes with
          a decisive vote.
        </p>
        <div className="flex justify-center gap-8">
          <Button as={Link} href="/rules/executives" target="_blank">
            Rules
          </Button>
        </div>
      </div>
      <div className="mb-16 flex items-center justify-center gap-2">
        {user ? (
          <Button as={Link} href="/rooms">Join a Game</Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-lg text-default-900">
              In order to play you must have an account.
            </p>
            <Button as={Link} href="/account/login">Login / Sign Up</Button>
          </div>
        )}
      </div>
    </div>
  );
}
