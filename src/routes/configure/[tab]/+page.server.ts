import type { EntryGenerator } from "./$types"

export const entries: EntryGenerator = () => {
  return [
    { tab: "routes" },
    { tab: "customize" },
    { tab: "advanced" },
  ]
}
