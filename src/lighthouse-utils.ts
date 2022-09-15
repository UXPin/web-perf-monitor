import meanBy from "lodash/meanBy.js";

// Data returned by Lighthouse
// TODO: how to use here the type `LH.RunnerResult`?
type LightHouseReport = {
  lhr: {
    categories: {
      performance: {
        score: number;
      };
    };
    audits: {
      ["speed-index"]: {
        numericValue: number;
      };
    };
  };
};

export function getScore(result: LightHouseReport) {
  return result.lhr.categories.performance.score;
}

export function getSpeedIndex(result: LightHouseReport) {
  return result.lhr.audits["speed-index"].numericValue;
}

export function getSummary(result: LightHouseReport): Summary {
  const score = getScore(result);
  const speedIndex = getSpeedIndex(result);

  return { score, speedIndex };
}

export type Summary = {
  score: number;
  speedIndex: number;
};

export function getAverageSummary(summaries: Summary[]): Summary {
  const score = meanBy<Summary>(summaries, (summary) => summary.score);
  const speedIndex = meanBy<Summary>(
    summaries,
    (summary) => summary.speedIndex
  );

  return { score, speedIndex };
}
