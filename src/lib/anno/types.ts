export type Region = "old-world" | "new-world";

export type GoodCategoryId =
  "raw" | "agricultural" | "intermediate" | "construction" | "consumer";

/** The game's own goods categories, as in its warehouse and statistics. */
export type GoodCategory = {
  id: GoodCategoryId;
  name: string;
};

export type Good = {
  id: string;
  name: string;
  category: GoodCategoryId;
};

export type Workforce = {
  id: string;
  name: string;
};

export type GoodAmount = {
  good: string;
  /** Units per produced unit of the primary output. */
  amount: number;
};

export type Building = {
  id: string;
  name: string;
  region: Region;
  /** Primary output in tons per minute at 100% productivity. */
  tpmin: number;
  inputs: GoodAmount[];
  outputs: GoodAmount[];
  workforce: { type: string; count: number } | null;
};

export type PopulationNeed = {
  good: string;
  perResidentPerMinute: number;
};

export type PopulationTier = {
  id: string;
  name: string;
  residenceName: string;
  residentsPerHouse: number;
  /** Workforce type these residents provide. */
  workforce: string;
  needs: PopulationNeed[];
};
