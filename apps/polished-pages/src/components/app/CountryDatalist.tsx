import { COUNTRIES } from "@/lib/countries";

// Shared <datalist> of countries (United States first). Render once on a page,
// then point any <Input list="country-options" /> at it for a dropdown of
// suggestions while keeping the field free-text.
const CountryDatalist = () => (
  <datalist id="country-options">
    {COUNTRIES.map((c) => <option key={c} value={c} />)}
  </datalist>
);

export default CountryDatalist;
