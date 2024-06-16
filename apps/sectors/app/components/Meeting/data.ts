export type TopicKey = "player" | "sector" | "company";
export interface Topic {
  key: TopicKey;
  label: string;
}
export const topics = [
  { key: "player", label: "Players" },
  { key: "sector", label: "Sectors" },
  { key: "company", label: "Companies" },
];
