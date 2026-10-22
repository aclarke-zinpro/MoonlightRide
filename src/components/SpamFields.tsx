/**
 * Hidden anti-spam fields (research.md R7): a honeypot people never see or reach, and a signed
 * timestamp of when the form was rendered.
 */
export function SpamFields({ formTs }: { formTs: string }) {
  return (
    <>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name="formTs" value={formTs} />
    </>
  );
}
