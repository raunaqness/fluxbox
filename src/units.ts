export type UnitCategory = 
  | 'Length' 
  | 'Mass' 
  | 'Temperature' 
  | 'Volume' 
  | 'Area' 
  | 'Speed' 
  | 'Time' 
  | 'Data' 
  | 'Energy' 
  | 'Pressure';

export interface UnitDef {
  id: string;
  label: string;
  category: UnitCategory;
  // ratio to base unit for this category, or a function for non-linear conversion like temperature
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const buildLinearUnit = (id: string, label: string, category: UnitCategory, ratioToDefault: number): UnitDef => ({
  id,
  label,
  category,
  toBase: (val) => val * ratioToDefault,
  fromBase: (val) => val / ratioToDefault,
});

export const UNITS: UnitDef[] = [
  // Length (Base: meters)
  buildLinearUnit('mm', 'Millimeter', 'Length', 0.001),
  buildLinearUnit('cm', 'Centimeter', 'Length', 0.01),
  buildLinearUnit('m', 'Meter', 'Length', 1),
  buildLinearUnit('km', 'Kilometer', 'Length', 1000),
  buildLinearUnit('in', 'Inch', 'Length', 0.0254),
  buildLinearUnit('ft', 'Foot', 'Length', 0.3048),
  buildLinearUnit('yd', 'Yard', 'Length', 0.9144),
  buildLinearUnit('mi', 'Mile', 'Length', 1609.34),

  // Mass (Base: kilograms)
  buildLinearUnit('mg', 'Milligram', 'Mass', 0.000001),
  buildLinearUnit('g', 'Gram', 'Mass', 0.001),
  buildLinearUnit('kg', 'Kilogram', 'Mass', 1),
  buildLinearUnit('t', 'Metric Ton', 'Mass', 1000),
  buildLinearUnit('oz', 'Ounce', 'Mass', 0.0283495),
  buildLinearUnit('lb', 'Pound', 'Mass', 0.453592),

  // Temperature (Base: Celsius)
  {
    id: 'c',
    label: 'Celsius',
    category: 'Temperature',
    toBase: (val) => val,
    fromBase: (val) => val,
  },
  {
    id: 'f',
    label: 'Fahrenheit',
    category: 'Temperature',
    toBase: (val) => (val - 32) * 5 / 9,
    fromBase: (val) => (val * 9 / 5) + 32,
  },
  {
    id: 'k',
    label: 'Kelvin',
    category: 'Temperature',
    toBase: (val) => val - 273.15,
    fromBase: (val) => val + 273.15,
  },

  // Volume (Base: Liters)
  buildLinearUnit('ml', 'Milliliter', 'Volume', 0.001),
  buildLinearUnit('l', 'Liter', 'Volume', 1),
  buildLinearUnit('floz', 'Fluid Ounce (US)', 'Volume', 0.0295735),
  buildLinearUnit('cup', 'Cup (US)', 'Volume', 0.24),
  buildLinearUnit('pt', 'Pint (US)', 'Volume', 0.473176),
  buildLinearUnit('qt', 'Quart (US)', 'Volume', 0.946353),
  buildLinearUnit('gal', 'Gallon (US)', 'Volume', 3.78541),

  // Area (Base: Square Meters)
  buildLinearUnit('cm2', 'Sq Centimeter', 'Area', 0.0001),
  buildLinearUnit('m2', 'Sq Meter', 'Area', 1),
  buildLinearUnit('km2', 'Sq Kilometer', 'Area', 1000000),
  buildLinearUnit('in2', 'Sq Inch', 'Area', 0.00064516),
  buildLinearUnit('ft2', 'Sq Foot', 'Area', 0.092903),
  buildLinearUnit('acre', 'Acre', 'Area', 4046.86),

  // Speed (Base: m/s)
  buildLinearUnit('m/s', 'Meter/sec', 'Speed', 1),
  buildLinearUnit('km/h', 'Km/hour', 'Speed', 0.277778),
  buildLinearUnit('mph', 'Miles/hour', 'Speed', 0.44704),
  buildLinearUnit('knot', 'Knot', 'Speed', 0.514444),

  // Time (Base: seconds)
  buildLinearUnit('ms', 'Millisecond', 'Time', 0.001),
  buildLinearUnit('s', 'Second', 'Time', 1),
  buildLinearUnit('min', 'Minute', 'Time', 60),
  buildLinearUnit('h', 'Hour', 'Time', 3600),
  buildLinearUnit('d', 'Day', 'Time', 86400),
  buildLinearUnit('wk', 'Week', 'Time', 604800),

  // Data (Base: Bytes)
  buildLinearUnit('b', 'Byte', 'Data', 1),
  buildLinearUnit('kb', 'Kilobyte', 'Data', 1024),
  buildLinearUnit('mb', 'Megabyte', 'Data', 1048576),
  buildLinearUnit('gb', 'Gigabyte', 'Data', 1073741824),
  buildLinearUnit('tb', 'Terabyte', 'Data', 1099511627776),

  // Energy (Base: Joules)
  buildLinearUnit('j', 'Joule', 'Energy', 1),
  buildLinearUnit('kj', 'Kilojoule', 'Energy', 1000),
  buildLinearUnit('cal', 'Calorie', 'Energy', 4.184),
  buildLinearUnit('kcal', 'Kilocalorie', 'Energy', 4184),
  buildLinearUnit('kwh', 'Kilowatt-hour', 'Energy', 3600000),

  // Pressure (Base: Pascals)
  buildLinearUnit('pa', 'Pascal', 'Pressure', 1),
  buildLinearUnit('kpa', 'Kilopascal', 'Pressure', 1000),
  buildLinearUnit('bar', 'Bar', 'Pressure', 100000),
  buildLinearUnit('psi', 'PSI', 'Pressure', 6894.76),
  buildLinearUnit('atm', 'Atmosphere', 'Pressure', 101325),
];

export const UNIT_MAP = new Map<string, UnitDef>(UNITS.map(u => [u.id, u]));

export function convertUnit(val: number, fromId: string, toId: string): number | null {
  const from = UNIT_MAP.get(fromId);
  const to = UNIT_MAP.get(toId);
  
  if (!from || !to) return null;
  if (from.category !== to.category) return null;
  
  const baseVal = from.toBase(val);
  return to.fromBase(baseVal);
}
