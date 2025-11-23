-- CreateIndex
CREATE INDEX "ExecutiveCard_gameId_cardLocation_idx" ON "ExecutiveCard"("gameId", "cardLocation");

-- CreateIndex
CREATE INDEX "ExecutiveCard_gameId_playerId_idx" ON "ExecutiveCard"("gameId", "playerId");

-- CreateIndex
CREATE INDEX "ExecutivePlayer_gameId_isCOO_idx" ON "ExecutivePlayer"("gameId", "isCOO");

-- CreateIndex
CREATE INDEX "ExecutivePlayer_gameId_isGeneralCounsel_idx" ON "ExecutivePlayer"("gameId", "isGeneralCounsel");
