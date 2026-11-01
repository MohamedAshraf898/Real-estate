// Demo content. Change BRAND and the PROPERTIES list to use your own project.
window.BRAND = {
  name: 'Linden Residences',
  district: 'New Belgrade',
  address: 'Linden Boulevard 12, New Belgrade',
  phone: '+381 00 000 0000',
  email: 'sales@linden-residences.example',
};

// Free photos from Unsplash (Unsplash License). Swap for your own renders later.
const U = id => w => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fm=jpg&fit=crop`;
window.IMG = {
  hero: U('1624204386084-dd8c05e32226'), facade: U('1775733924031-521cd86c69cc'), tower: U('1545324418-cc1a3fa10c00'), block: U('1784853879843-f3c5aacf2569'),
  living1: U('1724582586529-62622e50c0b3'), living2: U('1705321963943-de94bb3f0dd3'), living3: U('1564078516393-cf04bd966897'), living4: U('1616137148650-4aa14651e02b'),
  bed1: U('1616594039964-ae9021a400a0'), bed2: U('1615874959474-d609969a20ed'), kitchen1: U('1556911220-bff31c812dba'), kitchen2: U('1617228069096-4638a7ffc906'),
  rooftop: U('1769690093863-4f2a3fd17dd2'), rooftop2: U('1758193431353-87812fbff5cd'), gym: U('1758448756350-3d0eec02ba37'), restaurant: U('1493246318656-5bfd4cfb29b8'),
  garage: U('1548343361-02248be15911'), city: U('1685993990572-11ec9ff712e9'), city2: U('1685994199006-c742305775ff'), aerial: U('1527690499469-ef2eff9c6735'),
  model: U('1624066969616-69b0b0301d4d'), floorplan: U('1786550860329-f813516e9705'),
};

const P = (id, type, title, wing, floor, beds, baths, area, outdoor, price, status, orient, images, extra) =>
  Object.assign({ id, type, title, wing, floor, beds, baths, area, outdoor, price, status, orient, images, parking: true, storage: false, view: 'City' }, extra || {});

window.PROPERTIES = [
  P('a-0712', 'Apartment', 'Two Bedroom', 'A', 7, 2, 2, 68, 9, 289000, 'Available', 'South', ['living1', 'kitchen1', 'bed1', 'floorplan'], { view: 'Park', storage: true }),
  P('b-0304', 'Apartment', 'Studio', 'B', 3, 0, 1, 34, 4, 142000, 'New', 'East', ['living3', 'kitchen2', 'bed2', 'floorplan'], { parking: false }),
  P('a-1101', 'Apartment', 'Three Bedroom', 'A', 11, 3, 2, 96, 14, 415000, 'Reserved', 'South-West', ['living2', 'kitchen1', 'bed1', 'floorplan'], { view: 'Park', storage: true }),
  P('v-0505', 'Apartment', 'One Bedroom', 'V', 5, 1, 1, 46, 6, 198000, 'Available', 'West', ['living4', 'kitchen2', 'bed2', 'floorplan']),
  P('a-1402', 'Penthouse', 'Penthouse', 'A', 14, 4, 3, 152, 48, 690000, 'Available', 'South', ['rooftop2', 'living1', 'bed1', 'floorplan'], { view: 'Park', storage: true }),
  P('b-0809', 'Apartment', 'Two Bedroom', 'B', 8, 2, 1, 62, 8, 301000, 'Available', 'North-East', ['living3', 'kitchen1', 'bed2', 'floorplan']),
  P('v-0203', 'Apartment', 'Studio', 'V', 2, 0, 1, 30, 0, 128000, 'Sold', 'North', ['living4', 'kitchen2', 'bed2', 'floorplan'], { parking: false }),
  P('a-0906', 'Apartment', 'Three Bedroom', 'A', 9, 3, 2, 88, 11, 382000, 'Available', 'East', ['living2', 'kitchen2', 'bed1', 'floorplan'], { storage: true }),
  P('b-1201', 'Apartment', 'One Bedroom', 'B', 12, 1, 1, 52, 7, 236000, 'New', 'South', ['living1', 'kitchen1', 'bed2', 'floorplan'], { view: 'Park' }),
  P('v-1004', 'Apartment', 'Four Bedroom', 'V', 10, 4, 3, 128, 18, 548000, 'Available', 'South-East', ['living2', 'kitchen1', 'bed1', 'floorplan'], { storage: true }),
  P('a-g01', 'Retail', 'Retail Unit', 'A', 0, 0, 1, 112, 0, 455000, 'Available', 'Street front', ['restaurant', 'block', 'facade', 'floorplan'], { parking: false }),
  P('b-0201', 'Office', 'Office Suite', 'B', 2, 0, 2, 140, 0, 520000, 'Available', 'West', ['tower', 'facade', 'block', 'floorplan']),
];

window.PLACES = [
  ['train', 'Railway station', 'Transport', '3 min', 'walk'],
  ['user', 'International school', 'Education', '4 min', 'walk'],
  ['bag', 'Shopping & dining district', 'Shopping', '5 min', 'walk'],
  ['briefcase', 'Business park', 'Offices', '4 min', 'drive'],
  ['tree', 'Sava river promenade', 'Nature', '8 min', 'walk'],
  ['plane', 'International airport', 'Travel', '12 min', 'drive'],
];

window.PAYMENT = [[20, 'Reservation & pre-contract'], [20, 'Foundations complete'], [20, 'Structure complete'], [30, 'Building 80% complete'], [10, 'Handover']];
