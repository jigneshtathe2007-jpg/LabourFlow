
import { list, insertRow, today } from "./utils.js";

export const HAJIRI = [
  ["P3", 3, "3-hour shift"],
  ["P5", 5, "5-hour shift"],
  ["P5+2", 7, "5 hrs + 2 hrs extra"],
  ["P6", 6, "6-hour shift"],
  ["P7", 7, "7-hour shift"],
  ["P8", 8, "Full 8-hour shift"],
  ["P8+2", 10, "8 hrs + 2 hrs overtime"],
  ["P12", 12, "Double shift"]
];

const TRADES = [
  ["Fitter", "Blue", "SKILLED", 195],
  ["Carpenter", "Yellow", "SKILLED", 150],
  ["Green Labour", "Green", "UNSKILLED", 110],
  ["Bankum Kadia", "Mason B", "SEMISKILLED", 145],
  ["Plaster Kadia", "Mason A", "SKILLED", 200],
  ["Crane Operator", "Heavy", "SKILLED", 467]
];

export async function seedMasters() {
  const [codes, trades, rates, sites] = await Promise.all([
    list("hajiriCodes"),
    list("trades"),
    list("tradeRateMaster"),
    list("sites")
  ]);

  for (const [code, hours, description] of HAJIRI) {
    if (!codes.some(r => r.hajiriCode === code)) {
      await insertRow("hajiriCodes", "hajiriCode", {
        hajiriCode: code,
        hoursWorked: hours,
        hajiriUnits: hours / 2,
        description
      });
    }
  }

  for (const [name, color, skill, rate] of TRADES) {
    let trade = trades.find(
      r => (r.tradeName || r.trade_name) === name
    );

    if (!trade) {
      const id = await insertRow("trades", "tradeId", {
        tradeName: name,
        colorCode: color,
        skillLevel: skill
      });

      trade = { tradeId: id, tradeName: name };
      trades.push(trade);
    }

    const tradeId = trade.tradeId ?? trade.trade_id;

    const hasRate = rates.some(
      r => Number(r.tradeId ?? r.trade_id) === Number(tradeId)
    );

    if (!hasRate) {
      await insertRow("tradeRateMaster", "tradeRateId", {
        tradeId,
        baseDailyRate: rate,
        effectiveFrom: "2026-01-01",
        effectiveTo: null
      });
    }
  }

  for (const name of ["Kalher", "Dosti", "Thane"]) {
    if (!sites.some(r => (r.siteName || r.site_name) === name)) {
      await insertRow("sites", "siteId", {
        siteName: name,
        location: name + ", Thane",
        createdDate: today()
      });
    }
  }
}

export async function resetMasters() {
  throw new Error(
    "Reset is disabled to protect your existing database records."
  );
}
