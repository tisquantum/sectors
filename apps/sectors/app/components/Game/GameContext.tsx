import React, { createContext, useContext, ReactNode } from 'react';

interface GameContextProps {
  gameId: string;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ gameId: string; children: ReactNode }> = ({ gameId, children }) => {
  return <GameContext.Provider value={{ gameId }}>{children}</GameContext.Provider>;
};
