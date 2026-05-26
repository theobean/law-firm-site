const polyfill = `
  if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function(compareFn) {
      return [...this].sort(compareFn);
    };
  }
  if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function() {
      return [...this].reverse();
    };
  }
  if (!Array.prototype.toSpliced) {
    Array.prototype.toSpliced = function(...args) {
      const arr = [...this];
      arr.splice(...args);
      return arr;
    };
  }
`;

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head>
        <script dangerouslySetInnerHTML={{ __html: polyfill }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
