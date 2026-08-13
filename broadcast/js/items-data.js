(() => {
  "use strict";
  const items = [
  {
    "id": "defense_1_1",
    "name": "Defense T1-1",
    "category": "Defense",
    "tier": 1,
    "asset": "assets/items/icons/defense_1_1.webp"
  },
  {
    "id": "defense_1_2",
    "name": "Defense T1-2",
    "category": "Defense",
    "tier": 1,
    "asset": "assets/items/icons/defense_1_2.webp"
  },
  {
    "id": "defense_1_3",
    "name": "Defense T1-3",
    "category": "Defense",
    "tier": 1,
    "asset": "assets/items/icons/defense_1_3.webp"
  },
  {
    "id": "defense_1_4",
    "name": "Defense T1-4",
    "category": "Defense",
    "tier": 1,
    "asset": "assets/items/icons/defense_1_4.webp"
  },
  {
    "id": "defense_2_1",
    "name": "Defense T2-1",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_1.webp"
  },
  {
    "id": "defense_2_10",
    "name": "Defense T2-10",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_10.webp"
  },
  {
    "id": "defense_2_11",
    "name": "Defense T2-11",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_11.webp"
  },
  {
    "id": "defense_2_2",
    "name": "Defense T2-2",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_2.webp"
  },
  {
    "id": "defense_2_3",
    "name": "Defense T2-3",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_3.webp"
  },
  {
    "id": "defense_2_4",
    "name": "Defense T2-4",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_4.webp"
  },
  {
    "id": "defense_2_5",
    "name": "Defense T2-5",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_5.webp"
  },
  {
    "id": "defense_2_6",
    "name": "Defense T2-6",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_6.webp"
  },
  {
    "id": "defense_2_7",
    "name": "Defense T2-7",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_7.webp"
  },
  {
    "id": "defense_2_8",
    "name": "Defense T2-8",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_8.webp"
  },
  {
    "id": "defense_2_9",
    "name": "Defense T2-9",
    "category": "Defense",
    "tier": 2,
    "asset": "assets/items/icons/defense_2_9.webp"
  },
  {
    "id": "defense_3_1",
    "name": "Defense T3-1",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_1.webp"
  },
  {
    "id": "defense_3_10",
    "name": "Defense T3-10",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_10.webp"
  },
  {
    "id": "defense_3_11",
    "name": "Defense T3-11",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_11.webp"
  },
  {
    "id": "defense_3_12",
    "name": "Defense T3-12",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_12.webp"
  },
  {
    "id": "defense_3_2",
    "name": "Defense T3-2",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_2.webp"
  },
  {
    "id": "defense_3_3",
    "name": "Defense T3-3",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_3.webp"
  },
  {
    "id": "defense_3_4",
    "name": "Defense T3-4",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_4.webp"
  },
  {
    "id": "defense_3_5",
    "name": "Defense T3-5",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_5.webp"
  },
  {
    "id": "defense_3_6",
    "name": "Defense T3-6",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_6.webp"
  },
  {
    "id": "defense_3_7",
    "name": "Defense T3-7",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_7.webp"
  },
  {
    "id": "defense_3_8",
    "name": "Defense T3-8",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_8.webp"
  },
  {
    "id": "defense_3_9",
    "name": "Defense T3-9",
    "category": "Defense",
    "tier": 3,
    "asset": "assets/items/icons/defense_3_9.webp"
  },
  {
    "id": "jungle_1_1",
    "name": "Jungle T1-1",
    "category": "Jungle",
    "tier": 1,
    "asset": "assets/items/icons/jungle_1_1.webp"
  },
  {
    "id": "jungle_1_2",
    "name": "Jungle T1-2",
    "category": "Jungle",
    "tier": 1,
    "asset": "assets/items/icons/jungle_1_2.webp"
  },
  {
    "id": "jungle_2_1",
    "name": "Jungle T2-1",
    "category": "Jungle",
    "tier": 2,
    "asset": "assets/items/icons/jungle_2_1.webp"
  },
  {
    "id": "jungle_2_2",
    "name": "Jungle T2-2",
    "category": "Jungle",
    "tier": 2,
    "asset": "assets/items/icons/jungle_2_2.webp"
  },
  {
    "id": "jungle_2_3",
    "name": "Jungle T2-3",
    "category": "Jungle",
    "tier": 2,
    "asset": "assets/items/icons/jungle_2_3.webp"
  },
  {
    "id": "jungle_2_4",
    "name": "Jungle T2-4",
    "category": "Jungle",
    "tier": 2,
    "asset": "assets/items/icons/jungle_2_4.webp"
  },
  {
    "id": "jungle_3_1",
    "name": "Jungle T3-1",
    "category": "Jungle",
    "tier": 3,
    "asset": "assets/items/icons/jungle_3_1.webp"
  },
  {
    "id": "jungle_3_2",
    "name": "Jungle T3-2",
    "category": "Jungle",
    "tier": 3,
    "asset": "assets/items/icons/jungle_3_2.webp"
  },
  {
    "id": "jungle_3_3",
    "name": "Jungle T3-3",
    "category": "Jungle",
    "tier": 3,
    "asset": "assets/items/icons/jungle_3_3.webp"
  },
  {
    "id": "jungle_3_4",
    "name": "Jungle T3-4",
    "category": "Jungle",
    "tier": 3,
    "asset": "assets/items/icons/jungle_3_4.webp"
  },
  {
    "id": "magic_1_1",
    "name": "Magic T1-1",
    "category": "Magic",
    "tier": 1,
    "asset": "assets/items/icons/magic_1_1.webp"
  },
  {
    "id": "magic_1_2",
    "name": "Magic T1-2",
    "category": "Magic",
    "tier": 1,
    "asset": "assets/items/icons/magic_1_2.webp"
  },
  {
    "id": "magic_1_3",
    "name": "Magic T1-3",
    "category": "Magic",
    "tier": 1,
    "asset": "assets/items/icons/magic_1_3.webp"
  },
  {
    "id": "magic_1_4",
    "name": "Magic T1-4",
    "category": "Magic",
    "tier": 1,
    "asset": "assets/items/icons/magic_1_4.webp"
  },
  {
    "id": "magic_1_5",
    "name": "Magic T1-5",
    "category": "Magic",
    "tier": 1,
    "asset": "assets/items/icons/magic_1_5.webp"
  },
  {
    "id": "magic_2_1",
    "name": "Magic T2-1",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_1.webp"
  },
  {
    "id": "magic_2_10",
    "name": "Magic T2-10",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_10.webp"
  },
  {
    "id": "magic_2_11",
    "name": "Magic T2-11",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_11.webp"
  },
  {
    "id": "magic_2_12",
    "name": "Magic T2-12",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_12.webp"
  },
  {
    "id": "magic_2_2",
    "name": "Magic T2-2",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_2.webp"
  },
  {
    "id": "magic_2_3",
    "name": "Magic T2-3",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_3.webp"
  },
  {
    "id": "magic_2_4",
    "name": "Magic T2-4",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_4.webp"
  },
  {
    "id": "magic_2_5",
    "name": "Magic T2-5",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_5.webp"
  },
  {
    "id": "magic_2_6",
    "name": "Magic T2-6",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_6.webp"
  },
  {
    "id": "magic_2_7",
    "name": "Magic T2-7",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_7.webp"
  },
  {
    "id": "magic_2_8",
    "name": "Magic T2-8",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_8.webp"
  },
  {
    "id": "magic_2_9",
    "name": "Magic T2-9",
    "category": "Magic",
    "tier": 2,
    "asset": "assets/items/icons/magic_2_9.webp"
  },
  {
    "id": "magic_3_1",
    "name": "Magic T3-1",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_1.webp"
  },
  {
    "id": "magic_3_10",
    "name": "Magic T3-10",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_10.webp"
  },
  {
    "id": "magic_3_11",
    "name": "Magic T3-11",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_11.webp"
  },
  {
    "id": "magic_3_12",
    "name": "Magic T3-12",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_12.webp"
  },
  {
    "id": "magic_3_2",
    "name": "Magic T3-2",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_2.webp"
  },
  {
    "id": "magic_3_3",
    "name": "Magic T3-3",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_3.webp"
  },
  {
    "id": "magic_3_4",
    "name": "Magic T3-4",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_4.webp"
  },
  {
    "id": "magic_3_5",
    "name": "Magic T3-5",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_5.webp"
  },
  {
    "id": "magic_3_6",
    "name": "Magic T3-6",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_6.webp"
  },
  {
    "id": "magic_3_7",
    "name": "Magic T3-7",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_7.webp"
  },
  {
    "id": "magic_3_8",
    "name": "Magic T3-8",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_8.webp"
  },
  {
    "id": "magic_3_9",
    "name": "Magic T3-9",
    "category": "Magic",
    "tier": 3,
    "asset": "assets/items/icons/magic_3_9.webp"
  },
  {
    "id": "move_1_1",
    "name": "Movement T1-1",
    "category": "Movement",
    "tier": 1,
    "asset": "assets/items/icons/move_1_1.webp"
  },
  {
    "id": "move_2_1",
    "name": "Movement T2-1",
    "category": "Movement",
    "tier": 2,
    "asset": "assets/items/icons/move_2_1.webp"
  },
  {
    "id": "move_2_2",
    "name": "Movement T2-2",
    "category": "Movement",
    "tier": 2,
    "asset": "assets/items/icons/move_2_2.webp"
  },
  {
    "id": "move_2_3",
    "name": "Movement T2-3",
    "category": "Movement",
    "tier": 2,
    "asset": "assets/items/icons/move_2_3.webp"
  },
  {
    "id": "move_2_4",
    "name": "Movement T2-4",
    "category": "Movement",
    "tier": 2,
    "asset": "assets/items/icons/move_2_4.webp"
  },
  {
    "id": "move_2_5",
    "name": "Movement T2-5",
    "category": "Movement",
    "tier": 2,
    "asset": "assets/items/icons/move_2_5.webp"
  },
  {
    "id": "move_2_6",
    "name": "Movement T2-6",
    "category": "Movement",
    "tier": 2,
    "asset": "assets/items/icons/move_2_6.webp"
  },
  {
    "id": "physical_1_1",
    "name": "Attack T1-1",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_1.webp"
  },
  {
    "id": "physical_1_2",
    "name": "Attack T1-2",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_2.webp"
  },
  {
    "id": "physical_1_3",
    "name": "Attack T1-3",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_3.webp"
  },
  {
    "id": "physical_1_4",
    "name": "Attack T1-4",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_4.webp"
  },
  {
    "id": "physical_1_5",
    "name": "Attack T1-5",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_5.webp"
  },
  {
    "id": "physical_1_6",
    "name": "Attack T1-6",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_6.webp"
  },
  {
    "id": "physical_1_7",
    "name": "Attack T1-7",
    "category": "Attack",
    "tier": 1,
    "asset": "assets/items/icons/physical_1_7.webp"
  },
  {
    "id": "physical_2_1",
    "name": "Attack T2-1",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_1.webp"
  },
  {
    "id": "physical_2_10",
    "name": "Attack T2-10",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_10.webp"
  },
  {
    "id": "physical_2_11",
    "name": "Attack T2-11",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_11.webp"
  },
  {
    "id": "physical_2_12",
    "name": "Attack T2-12",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_12.webp"
  },
  {
    "id": "physical_2_13",
    "name": "Attack T2-13",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_13.webp"
  },
  {
    "id": "physical_2_2",
    "name": "Attack T2-2",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_2.webp"
  },
  {
    "id": "physical_2_3",
    "name": "Attack T2-3",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_3.webp"
  },
  {
    "id": "physical_2_4",
    "name": "Attack T2-4",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_4.webp"
  },
  {
    "id": "physical_2_5",
    "name": "Attack T2-5",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_5.webp"
  },
  {
    "id": "physical_2_6",
    "name": "Attack T2-6",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_6.webp"
  },
  {
    "id": "physical_2_7",
    "name": "Attack T2-7",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_7.webp"
  },
  {
    "id": "physical_2_8",
    "name": "Attack T2-8",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_8.webp"
  },
  {
    "id": "physical_2_9",
    "name": "Attack T2-9",
    "category": "Attack",
    "tier": 2,
    "asset": "assets/items/icons/physical_2_9.webp"
  },
  {
    "id": "physical_3_1",
    "name": "Attack T3-1",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_1.webp"
  },
  {
    "id": "physical_3_10",
    "name": "Attack T3-10",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_10.webp"
  },
  {
    "id": "physical_3_11",
    "name": "Attack T3-11",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_11.webp"
  },
  {
    "id": "physical_3_12",
    "name": "Attack T3-12",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_12.webp"
  },
  {
    "id": "physical_3_13",
    "name": "Attack T3-13",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_13.webp"
  },
  {
    "id": "physical_3_14",
    "name": "Attack T3-14",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_14.webp"
  },
  {
    "id": "physical_3_2",
    "name": "Attack T3-2",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_2.webp"
  },
  {
    "id": "physical_3_3",
    "name": "Attack T3-3",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_3.webp"
  },
  {
    "id": "physical_3_4",
    "name": "Attack T3-4",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_4.webp"
  },
  {
    "id": "physical_3_5",
    "name": "Attack T3-5",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_5.webp"
  },
  {
    "id": "physical_3_6",
    "name": "Attack T3-6",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_6.webp"
  },
  {
    "id": "physical_3_7",
    "name": "Attack T3-7",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_7.webp"
  },
  {
    "id": "physical_3_8",
    "name": "Attack T3-8",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_8.webp"
  },
  {
    "id": "physical_3_9",
    "name": "Attack T3-9",
    "category": "Attack",
    "tier": 3,
    "asset": "assets/items/icons/physical_3_9.webp"
  },
  {
    "id": "wander_1_1",
    "name": "Roaming T1-1",
    "category": "Roaming",
    "tier": 1,
    "asset": "assets/items/icons/wander_1_1.webp"
  },
  {
    "id": "wander_2_1",
    "name": "Roaming T2-1",
    "category": "Roaming",
    "tier": 2,
    "asset": "assets/items/icons/wander_2_1.webp"
  },
  {
    "id": "wander_2_2",
    "name": "Roaming T2-2",
    "category": "Roaming",
    "tier": 2,
    "asset": "assets/items/icons/wander_2_2.webp"
  },
  {
    "id": "wander_3_1",
    "name": "Roaming T3-1",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_1.webp"
  },
  {
    "id": "wander_3_2",
    "name": "Roaming T3-2",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_2.webp"
  },
  {
    "id": "wander_3_3",
    "name": "Roaming T3-3",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_3.webp"
  },
  {
    "id": "wander_3_4",
    "name": "Roaming T3-4",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_4.webp"
  },
  {
    "id": "wander_3_5",
    "name": "Roaming T3-5",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_5.webp"
  },
  {
    "id": "wander_3_6",
    "name": "Roaming T3-6",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_6.webp"
  },
  {
    "id": "wander_3_7",
    "name": "Roaming T3-7",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_7.webp"
  },
  {
    "id": "wander_3_8",
    "name": "Roaming T3-8",
    "category": "Roaming",
    "tier": 3,
    "asset": "assets/items/icons/wander_3_8.webp"
  }
];
  const itemMap = Object.freeze(items.reduce((a,i)=>(a[i.id]=i,a), Object.create(null)));
  window.HOK_ITEMS = Object.freeze(items);
  window.HOK_ITEM_MAP = itemMap;
})();
