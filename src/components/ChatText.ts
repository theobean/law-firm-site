import { createElement } from "react";

/** Untrusted chat text is always a text child. React escapes it at the DOM boundary.
 * Do not introduce innerHTML, an HTML parser, or manual HTML entity encoding here.
 */
export default function ChatText({ text, className, as = "p" }: {
  text: string;
  className?: string;
  as?: "p" | "span";
}) {
  return createElement(as === "span" ? "span" : "p", { className }, typeof text === "string" ? text : "");
}
