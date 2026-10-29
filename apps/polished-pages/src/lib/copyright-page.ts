// The copyright page's lines (DESIGN-SPEC.md §22), the same in the print interior, the EPUB and the
// preview beside the fields: the facts the author supplied, then the standard rights wording. A fact
// not supplied, or a placeholder ("[ISBN]"), is left out, never made up.
export interface CopyrightFacts {
  title: string; subtitle?: string; author?: string; rightsHolder?: string; year?: number;
  notices?: string[]; edition?: string; isbn?: string; publisher?: string;
  /** Credit line (the bound-book interior names the tool that set it). */
  producedWith?: string;
}

/** The book's facts as the exports take them (bookFacts in manuscript.ts gives them from the book's details). */
export interface BookFactsOpts { subtitle?: string; publisher?: string; rightsHolder?: string; isbn?: string; edition?: string; notices?: string[]; year?: number }

export const RIGHTS = "All rights reserved. No part of this book may be reproduced, stored in a retrieval system or transmitted in any form or by any means, electronic, mechanical, photocopying, recording or otherwise, without the prior written permission of the copyright holder, except for brief quotations in reviews and critical articles.";

/** A fact the author gave: not empty and not a placeholder. */
export const fact = (v?: string | null) => (v?.trim() && !/\[[^\]]*\]/.test(v) ? v.trim() : "");

export function copyrightLines(f: CopyrightFacts): string[] {
  const year = f.year ?? new Date().getFullYear();
  const owner = fact(f.rightsHolder) || fact(f.author);
  const isbn = fact(f.isbn).replace(/^isbn[:\s]*/i, "");
  return [
    [f.title, fact(f.subtitle)].filter(Boolean).join(": "),
    owner ? `Copyright © ${year} ${owner}.` : `Copyright © ${year}.`,
    RIGHTS,
    ...(f.notices ?? []).map((x) => fact(x)).filter(Boolean),
    ...(fact(f.edition) ? [fact(f.edition)] : []),
    ...(isbn ? [`ISBN ${isbn}`] : []),
    ...(fact(f.publisher) ? [`Published by ${fact(f.publisher)}`] : []),
    ...(f.producedWith ? [`Produced with ${f.producedWith}.`] : []),
  ];
}
