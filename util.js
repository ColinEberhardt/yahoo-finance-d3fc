const exchangeOpeningHours = day => [
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 30, 0),
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 16, 0, 0)
];

const isWithinOpeningHours = time => {
  const openingHours = exchangeOpeningHours(time);
  return time > openingHours[0] && time < openingHours[1];
}

const tradingHours = dates => {
  const getDateKey = date =>
    date.getMonth() + "-" + date.getDate() + "-" + date.getFullYear();

  const tradingHours = dates.reduce((acc, curr) => {
    const dateKey = getDateKey(curr);
    if (!acc.hasOwnProperty(dateKey)) {
      acc[dateKey] = [curr, curr];
    } else {
      acc[dateKey][1] = curr;
    }
    return acc;
  }, {});

  return Object.keys(tradingHours).map(d => tradingHours[d]);
};

const closest = (arr, fn) =>
  arr.reduce(
    (acc, value, index) =>
      fn(value) < acc.distance ? { distance: fn(value), index, value } : acc,
    {
      distance: Number.MAX_VALUE,
      index: 0,
      value: arr[0]
    }
  ).value;

const flatten = arr => [].concat.apply([], arr);