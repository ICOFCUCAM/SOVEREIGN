import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageTitle } from "@/lib/page-titles";

// Names the browser tab after the current page on every route change.
const PageTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => { document.title = pageTitle(pathname); }, [pathname]);
  return null;
};

export default PageTitle;
