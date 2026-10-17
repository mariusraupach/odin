// Generated from the Anno1800Calculator game data (github.com/NiHoel/Anno1800Calculator).
// Old World base game, plus New World chains that Old World needs depend on.
import type {
  Building,
  Good,
  GoodCategory,
  PopulationTier,
  Workforce,
} from "./types";

export const goodCategories: GoodCategory[] = [
  {
    id: "raw",
    name: "Raw Materials",
  },
  {
    id: "agricultural",
    name: "Agricultural Products",
  },
  {
    id: "intermediate",
    name: "Intermediate Products",
  },
  {
    id: "construction",
    name: "Construction Material",
  },
  {
    id: "consumer",
    name: "Consumer Goods",
  },
];

export const goods: Good[] = [
  {
    id: "1010566",
    name: "Oil",
    category: "raw",
  },
  {
    id: "1010192",
    name: "Grain",
    category: "agricultural",
  },
  {
    id: "1010193",
    name: "Beef",
    category: "agricultural",
  },
  {
    id: "1010194",
    name: "Hops",
    category: "agricultural",
  },
  {
    id: "1010195",
    name: "Potatoes",
    category: "agricultural",
  },
  {
    id: "120008",
    name: "Wood",
    category: "raw",
  },
  {
    id: "1010197",
    name: "Wool",
    category: "agricultural",
  },
  {
    id: "1010199",
    name: "Pigs",
    category: "agricultural",
  },
  {
    id: "1010209",
    name: "Furs",
    category: "agricultural",
  },
  {
    id: "120014",
    name: "Grapes",
    category: "agricultural",
  },
  {
    id: "1010198",
    name: "Red Peppers",
    category: "agricultural",
  },
  {
    id: "1010200",
    name: "Fish",
    category: "consumer",
  },
  {
    id: "1010232",
    name: "Saltpetre",
    category: "raw",
  },
  {
    id: "1010228",
    name: "Quartz Sand",
    category: "raw",
  },
  {
    id: "1010202",
    name: "Reinforced Concrete",
    category: "construction",
  },
  {
    id: "1010203",
    name: "Soap",
    category: "consumer",
  },
  {
    id: "1010196",
    name: "Timber",
    category: "construction",
  },
  {
    id: "1010205",
    name: "Bricks",
    category: "construction",
  },
  {
    id: "1010247",
    name: "Fur Coats",
    category: "consumer",
  },
  {
    id: "1010207",
    name: "Windows",
    category: "construction",
  },
  {
    id: "1010208",
    name: "Light Bulbs",
    category: "consumer",
  },
  {
    id: "1010210",
    name: "Sails",
    category: "construction",
  },
  {
    id: "1010211",
    name: "Chassis",
    category: "intermediate",
  },
  {
    id: "1010201",
    name: "Clay",
    category: "raw",
  },
  {
    id: "1010206",
    name: "Sewing Machines",
    category: "consumer",
  },
  {
    id: "1010213",
    name: "Bread",
    category: "consumer",
  },
  {
    id: "1010214",
    name: "Beer",
    category: "consumer",
  },
  {
    id: "1010215",
    name: "Goulash",
    category: "intermediate",
  },
  {
    id: "1010217",
    name: "Canned Food",
    category: "consumer",
  },
  {
    id: "1010216",
    name: "Schnapps",
    category: "consumer",
  },
  {
    id: "1010238",
    name: "Sausages",
    category: "consumer",
  },
  {
    id: "120016",
    name: "Champagne",
    category: "consumer",
  },
  {
    id: "1010218",
    name: "Steel Beams",
    category: "construction",
  },
  {
    id: "1010219",
    name: "Steel",
    category: "intermediate",
  },
  {
    id: "1010221",
    name: "Weapons",
    category: "construction",
  },
  {
    id: "1010222",
    name: "Dynamite",
    category: "intermediate",
  },
  {
    id: "1010223",
    name: "Advanced Weapons",
    category: "construction",
  },
  {
    id: "1010224",
    name: "Steam Motors",
    category: "intermediate",
  },
  {
    id: "1010225",
    name: "Steam Carriages",
    category: "consumer",
  },
  {
    id: "1010204",
    name: "Brass",
    category: "intermediate",
  },
  {
    id: "1010226",
    name: "Coal",
    category: "raw",
  },
  {
    id: "1010227",
    name: "Iron",
    category: "raw",
  },
  {
    id: "1010229",
    name: "Zinc",
    category: "raw",
  },
  {
    id: "1010230",
    name: "Copper",
    category: "raw",
  },
  {
    id: "1010231",
    name: "Cement",
    category: "raw",
  },
  {
    id: "1010233",
    name: "Gold Ore",
    category: "raw",
  },
  {
    id: "1010234",
    name: "Tallow",
    category: "intermediate",
  },
  {
    id: "1010235",
    name: "Flour",
    category: "intermediate",
  },
  {
    id: "1010236",
    name: "Malt",
    category: "intermediate",
  },
  {
    id: "1010237",
    name: "Work Clothes",
    category: "consumer",
  },
  {
    id: "1010241",
    name: "Glass",
    category: "intermediate",
  },
  {
    id: "1010242",
    name: "Wood Veneers",
    category: "intermediate",
  },
  {
    id: "1010243",
    name: "Filaments",
    category: "intermediate",
  },
  {
    id: "1010245",
    name: "Penny Farthings",
    category: "consumer",
  },
  {
    id: "1010246",
    name: "Pocket Watches",
    category: "consumer",
  },
  {
    id: "120030",
    name: "Spectacles",
    category: "consumer",
  },
  {
    id: "1010248",
    name: "Gramophones",
    category: "consumer",
  },
  {
    id: "1010249",
    name: "Gold",
    category: "intermediate",
  },
  {
    id: "1010250",
    name: "Jewellery",
    category: "consumer",
  },
  {
    id: "1010251",
    name: "Sugar Cane",
    category: "agricultural",
  },
  {
    id: "1010252",
    name: "Tobacco",
    category: "agricultural",
  },
  {
    id: "1010253",
    name: "Cotton",
    category: "agricultural",
  },
  {
    id: "1010254",
    name: "Cocoa",
    category: "agricultural",
  },
  {
    id: "1010255",
    name: "Caoutchouc",
    category: "agricultural",
  },
  {
    id: "120031",
    name: "Coffee Beans",
    category: "agricultural",
  },
  {
    id: "1010256",
    name: "Pearls",
    category: "raw",
  },
  {
    id: "1010257",
    name: "Rum",
    category: "consumer",
  },
  {
    id: "1010258",
    name: "Chocolate",
    category: "consumer",
  },
  {
    id: "120032",
    name: "Coffee",
    category: "consumer",
  },
  {
    id: "1010239",
    name: "Sugar",
    category: "intermediate",
  },
  {
    id: "1010240",
    name: "Cotton Fabric",
    category: "intermediate",
  },
  {
    id: "1010259",
    name: "Cigars",
    category: "consumer",
  },
];

export const workforce: Workforce[] = [
  {
    id: "1010052",
    name: "Farmer",
  },
  {
    id: "1010115",
    name: "Worker",
  },
  {
    id: "1010116",
    name: "Artisan",
  },
  {
    id: "1010117",
    name: "Engineer",
  },
  {
    id: "1010128",
    name: "Investor",
  },
  {
    id: "1010366",
    name: "Jornalero",
  },
  {
    id: "1010367",
    name: "Obrero",
  },
];

export const buildings: Building[] = [
  {
    id: "1010263",
    name: "Cattle Farm",
    region: "old-world",
    tpmin: 0.5,
    inputs: [],
    outputs: [
      {
        good: "1010193",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 20,
    },
  },
  {
    id: "1010278",
    name: "Fishery",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010200",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 25,
    },
  },
  {
    id: "1010313",
    name: "Flour Mill",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010192",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010235",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 10,
    },
  },
  {
    id: "1010315",
    name: "Framework Knitters",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010197",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010237",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 50,
    },
  },
  {
    id: "1010262",
    name: "Grain Farm",
    region: "old-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "1010192",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 20,
    },
  },
  {
    id: "1010264",
    name: "Hop Farm",
    region: "old-world",
    tpmin: 0.666666667,
    inputs: [],
    outputs: [
      {
        good: "1010194",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 20,
    },
  },
  {
    id: "1010558",
    name: "Hunting Cabin",
    region: "old-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "1010209",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 10,
    },
  },
  {
    id: "1010266",
    name: "Lumberjack's Hut",
    region: "old-world",
    tpmin: 4,
    inputs: [],
    outputs: [
      {
        good: "120008",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 5,
    },
  },
  {
    id: "1010269",
    name: "Pig Farm",
    region: "old-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "1010199",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 30,
    },
  },
  {
    id: "1010265",
    name: "Potato Farm",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010195",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 20,
    },
  },
  {
    id: "100654",
    name: "Red Pepper Farm",
    region: "old-world",
    tpmin: 0.5,
    inputs: [],
    outputs: [
      {
        good: "1010198",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 10,
    },
  },
  {
    id: "100451",
    name: "Sawmill",
    region: "old-world",
    tpmin: 4,
    inputs: [
      {
        good: "120008",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010196",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 10,
    },
  },
  {
    id: "1010294",
    name: "Schnapps Distillery",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010195",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010216",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 50,
    },
  },
  {
    id: "1010267",
    name: "Sheep Farm",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010197",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 10,
    },
  },
  {
    id: "100655",
    name: "Vineyard",
    region: "old-world",
    tpmin: 0.5,
    inputs: [],
    outputs: [
      {
        good: "120014",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010052",
      count: 10,
    },
  },
  {
    id: "1010291",
    name: "Bakery",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010235",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010213",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010282",
    name: "Brass Smeltery",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010229",
        amount: 1,
      },
      {
        good: "1010230",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010204",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010292",
    name: "Brewery",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010194",
        amount: 1,
      },
      {
        good: "1010236",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010214",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 75,
    },
  },
  {
    id: "1010283",
    name: "Brick Factory",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010201",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010205",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010298",
    name: "Charcoal Kiln",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010226",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 10,
    },
  },
  {
    id: "100416",
    name: "Clay Pit",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010201",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010304",
    name: "Coal Mine",
    region: "old-world",
    tpmin: 4,
    inputs: [],
    outputs: [
      {
        good: "1010226",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010308",
    name: "Copper Mine",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010230",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010297",
    name: "Furnace",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010227",
        amount: 1,
      },
      {
        good: "1010226",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010219",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 100,
    },
  },
  {
    id: "1010305",
    name: "Iron Mine",
    region: "old-world",
    tpmin: 4,
    inputs: [],
    outputs: [
      {
        good: "1010227",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010309",
    name: "Limestone Quarry",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010231",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010314",
    name: "Malthouse",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010192",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010236",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "101331",
    name: "Oil Refinery",
    region: "old-world",
    tpmin: 4,
    inputs: [],
    outputs: [
      {
        good: "1010566",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 100,
    },
  },
  {
    id: "1010312",
    name: "Rendering Works",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010199",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010234",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 40,
    },
  },
  {
    id: "1010288",
    name: "Sailmakers",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010197",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010210",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010310",
    name: "Saltpetre Works",
    region: "old-world",
    tpmin: 0.5,
    inputs: [],
    outputs: [
      {
        good: "1010232",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010560",
    name: "Sand Mine",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010228",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010316",
    name: "Slaughterhouse",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010199",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010238",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010281",
    name: "Soap Factory",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010234",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010203",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010296",
    name: "Steelworks",
    region: "old-world",
    tpmin: 1.333333333,
    inputs: [
      {
        good: "1010219",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010218",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 200,
    },
  },
  {
    id: "1010299",
    name: "Weapon Factory",
    region: "old-world",
    tpmin: 0.666666667,
    inputs: [
      {
        good: "1010219",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010221",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 50,
    },
  },
  {
    id: "1010307",
    name: "Zinc Mine",
    region: "old-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010229",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010115",
      count: 25,
    },
  },
  {
    id: "1010293",
    name: "Artisanal Kitchen",
    region: "old-world",
    tpmin: 0.5,
    inputs: [
      {
        good: "1010193",
        amount: 1,
      },
      {
        good: "1010198",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010215",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 75,
    },
  },
  {
    id: "1010295",
    name: "Cannery",
    region: "old-world",
    tpmin: 0.666666667,
    inputs: [
      {
        good: "1010227",
        amount: 1,
      },
      {
        good: "1010215",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010217",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 75,
    },
  },
  {
    id: "100659",
    name: "Champagne Cellar",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "120014",
        amount: 1,
      },
      {
        good: "1010241",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "120016",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 150,
    },
  },
  {
    id: "1010325",
    name: "Fur Dealer",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010209",
        amount: 1,
      },
      {
        good: "1010240",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010247",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 200,
    },
  },
  {
    id: "1010319",
    name: "Glassmakers",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010228",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010241",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 100,
    },
  },
  {
    id: "1010328",
    name: "Jewellers",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010256",
        amount: 1,
      },
      {
        good: "1010249",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010250",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 150,
    },
  },
  {
    id: "1010284",
    name: "Sewing Machine Factory",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "120008",
        amount: 1,
      },
      {
        good: "1010219",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010206",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 150,
    },
  },
  {
    id: "1010285",
    name: "Window Makers",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "120008",
        amount: 1,
      },
      {
        good: "1010241",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010207",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010116",
      count: 100,
    },
  },
  {
    id: "1010323",
    name: "Bicycle Factory",
    region: "old-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010219",
        amount: 1,
      },
      {
        good: "1010255",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010245",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010303",
    name: "Cab Assembly Line",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010211",
        amount: 1,
      },
      {
        good: "1010224",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010225",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 500,
    },
  },
  {
    id: "1010324",
    name: "Clockmakers",
    region: "old-world",
    tpmin: 0.666666667,
    inputs: [
      {
        good: "1010241",
        amount: 1,
      },
      {
        good: "1010249",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010246",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010289",
    name: "Coachmakers",
    region: "old-world",
    tpmin: 0.5,
    inputs: [
      {
        good: "120008",
        amount: 1,
      },
      {
        good: "1010255",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010211",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010280",
    name: "Concrete Factory",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010231",
        amount: 1,
      },
      {
        good: "1010219",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010202",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 75,
    },
  },
  {
    id: "1010300",
    name: "Dynamite Factory",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010234",
        amount: 1,
      },
      {
        good: "1010232",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010222",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 250,
    },
  },
  {
    id: "1010321",
    name: "Filament Factory",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010226",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010243",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010327",
    name: "Goldsmiths",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010226",
        amount: 1,
      },
      {
        good: "1010233",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010249",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 125,
    },
  },
  {
    id: "1010326",
    name: "Gramophone Factory",
    region: "old-world",
    tpmin: 0.5,
    inputs: [
      {
        good: "1010242",
        amount: 1,
      },
      {
        good: "1010204",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010248",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010301",
    name: "Heavy Weapons Factory",
    region: "old-world",
    tpmin: 0.5,
    inputs: [
      {
        good: "1010219",
        amount: 1,
      },
      {
        good: "1010222",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010223",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 250,
    },
  },
  {
    id: "1010286",
    name: "Light Bulb Factory",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "1010241",
        amount: 1,
      },
      {
        good: "1010243",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010208",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010320",
    name: "Marquetry Workshop",
    region: "old-world",
    tpmin: 1,
    inputs: [
      {
        good: "120008",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010242",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 150,
    },
  },
  {
    id: "1010302",
    name: "Motor Assembly Line",
    region: "old-world",
    tpmin: 0.666666667,
    inputs: [
      {
        good: "1010219",
        amount: 1,
      },
      {
        good: "1010204",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010224",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 250,
    },
  },
  {
    id: "101250",
    name: "Spectacle Factory",
    region: "old-world",
    tpmin: 0.666666667,
    inputs: [
      {
        good: "1010241",
        amount: 1,
      },
      {
        good: "1010204",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "120030",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010117",
      count: 100,
    },
  },
  {
    id: "1010333",
    name: "Caoutchouc Plantation",
    region: "new-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "1010255",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "1010332",
    name: "Cocoa Plantation",
    region: "new-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "1010254",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "101251",
    name: "Coffee Plantation",
    region: "new-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "120031",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "1010318",
    name: "Cotton Mill",
    region: "new-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010253",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010240",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "1010331",
    name: "Cotton Plantation",
    region: "new-world",
    tpmin: 1,
    inputs: [],
    outputs: [
      {
        good: "1010253",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "1010339",
    name: "Pearl Farm",
    region: "new-world",
    tpmin: 0.666666667,
    inputs: [],
    outputs: [
      {
        good: "1010256",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 50,
    },
  },
  {
    id: "1010340",
    name: "Rum Distillery",
    region: "new-world",
    tpmin: 2,
    inputs: [
      {
        good: "120008",
        amount: 1,
      },
      {
        good: "1010251",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010257",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 30,
    },
  },
  {
    id: "1010329",
    name: "Sugar Cane Plantation",
    region: "new-world",
    tpmin: 2,
    inputs: [],
    outputs: [
      {
        good: "1010251",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "1010330",
    name: "Tobacco Plantation",
    region: "new-world",
    tpmin: 0.5,
    inputs: [],
    outputs: [
      {
        good: "1010252",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010366",
      count: 10,
    },
  },
  {
    id: "1010341",
    name: "Chocolate Factory",
    region: "new-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010239",
        amount: 1,
      },
      {
        good: "1010254",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010258",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010367",
      count: 100,
    },
  },
  {
    id: "1010342",
    name: "Cigar Factory",
    region: "new-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010242",
        amount: 1,
      },
      {
        good: "1010252",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010259",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010367",
      count: 175,
    },
  },
  {
    id: "101252",
    name: "Coffee Roaster",
    region: "new-world",
    tpmin: 2,
    inputs: [
      {
        good: "120031",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "120032",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010367",
      count: 150,
    },
  },
  {
    id: "101311",
    name: "Gold Mine",
    region: "new-world",
    tpmin: 0.4,
    inputs: [],
    outputs: [
      {
        good: "1010233",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010367",
      count: 100,
    },
  },
  {
    id: "1010317",
    name: "Sugar Refinery",
    region: "new-world",
    tpmin: 2,
    inputs: [
      {
        good: "1010251",
        amount: 1,
      },
    ],
    outputs: [
      {
        good: "1010239",
        amount: 1,
      },
    ],
    workforce: {
      type: "1010367",
      count: 50,
    },
  },
];

export const populationTiers: PopulationTier[] = [
  {
    id: "15000000",
    name: "Farmers",
    residentsPerHouse: 10,
    residenceName: "Farmer Residence",
    workforce: "1010052",
    needs: [
      {
        good: "1010200",
        perResidentPerMinute: 0.0025,
      },
      {
        good: "1010216",
        perResidentPerMinute: 0.003333336,
      },
      {
        good: "1010237",
        perResidentPerMinute: 0.003076926,
      },
    ],
  },
  {
    id: "15000001",
    name: "Workers",
    residentsPerHouse: 20,
    residenceName: "Worker Residence",
    workforce: "1010115",
    needs: [
      {
        good: "1010200",
        perResidentPerMinute: 0.0025,
      },
      {
        good: "1010216",
        perResidentPerMinute: 0.003333336,
      },
      {
        good: "1010237",
        perResidentPerMinute: 0.003076926,
      },
      {
        good: "1010238",
        perResidentPerMinute: 0.001000002,
      },
      {
        good: "1010213",
        perResidentPerMinute: 0.00090909,
      },
      {
        good: "1010203",
        perResidentPerMinute: 0.000416667,
      },
      {
        good: "1010214",
        perResidentPerMinute: 0.00076923,
      },
    ],
  },
  {
    id: "15000002",
    name: "Artisans",
    residentsPerHouse: 30,
    residenceName: "Artisan Residence",
    workforce: "1010116",
    needs: [
      {
        good: "1010238",
        perResidentPerMinute: 0.001333334,
      },
      {
        good: "1010213",
        perResidentPerMinute: 0.001212122,
      },
      {
        good: "1010203",
        perResidentPerMinute: 0.000555556,
      },
      {
        good: "1010214",
        perResidentPerMinute: 0.001025642,
      },
      {
        good: "1010217",
        perResidentPerMinute: 0.00034188,
      },
      {
        good: "1010206",
        perResidentPerMinute: 0.00095238,
      },
      {
        good: "1010257",
        perResidentPerMinute: 0.001904762,
      },
      {
        good: "1010247",
        perResidentPerMinute: 0.000888888,
      },
    ],
  },
  {
    id: "15000003",
    name: "Engineers",
    residentsPerHouse: 40,
    residenceName: "Engineer Residence",
    workforce: "1010117",
    needs: [
      {
        good: "1010217",
        perResidentPerMinute: 0.00051282,
      },
      {
        good: "1010206",
        perResidentPerMinute: 0.001428572,
      },
      {
        good: "1010257",
        perResidentPerMinute: 0.002857143,
      },
      {
        good: "1010247",
        perResidentPerMinute: 0.001333334,
      },
      {
        good: "120030",
        perResidentPerMinute: 0.000222222,
      },
      {
        good: "1010245",
        perResidentPerMinute: 0.000625001,
      },
      {
        good: "120032",
        perResidentPerMinute: 0.001176471,
      },
      {
        good: "1010246",
        perResidentPerMinute: 0.000196079,
      },
      {
        good: "1010208",
        perResidentPerMinute: 0.0003125,
      },
    ],
  },
  {
    id: "15000004",
    name: "Investors",
    residentsPerHouse: 50,
    residenceName: "Investor Residence",
    workforce: "1010128",
    needs: [
      {
        good: "120030",
        perResidentPerMinute: 0.000355555,
      },
      {
        good: "1010245",
        perResidentPerMinute: 0.001,
      },
      {
        good: "120032",
        perResidentPerMinute: 0.001882352,
      },
      {
        good: "1010246",
        perResidentPerMinute: 0.000313726,
      },
      {
        good: "1010208",
        perResidentPerMinute: 0.0005,
      },
      {
        good: "120016",
        perResidentPerMinute: 0.0004704,
      },
      {
        good: "1010259",
        perResidentPerMinute: 0.000444444,
      },
      {
        good: "1010258",
        perResidentPerMinute: 0.001066667,
      },
      {
        good: "1010250",
        perResidentPerMinute: 0.000421052,
      },
      {
        good: "1010248",
        perResidentPerMinute: 0.00010524,
      },
      {
        good: "1010225",
        perResidentPerMinute: 0.000133333,
      },
    ],
  },
];
