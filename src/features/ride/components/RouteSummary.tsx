export function RouteSummary(props: {
  distanceMiles: number;
  pctGravel: number;
  pctTrail: number;
  pctPaved: number;
  elevationGainFt: number;
}) {
  const items = [
    `${props.distanceMiles} miles`,
    `${props.pctGravel}% gravel`,
    `${props.pctTrail}% doubletrack trail`,
    `${props.pctPaved}% paved`,
    `${props.elevationGainFt} ft elevation gain`,
  ];
  return (
    <ul aria-label="Route summary" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm">
          {item}
        </li>
      ))}
    </ul>
  );
}
