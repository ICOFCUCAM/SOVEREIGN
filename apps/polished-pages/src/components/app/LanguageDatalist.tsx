import { LANGUAGE_NAMES } from "@/lib/languages";

// Shared <datalist> for language suggestions. Render once on a page,
// then point any <Input list="language-options" /> at it.
const LanguageDatalist = () => (
  <datalist id="language-options">
    {LANGUAGE_NAMES.map((l) => <option key={l} value={l} />)}
  </datalist>
);

export default LanguageDatalist;
