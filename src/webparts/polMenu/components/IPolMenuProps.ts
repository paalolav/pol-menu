export interface IPolMenuProps {
  htmlFilePath: string;
  title: string;
  /** Absolute URL of the current web; the origin every source is resolved against. */
  pageOrigin: string;
  /** Comma-separated extra origins the author has allow-listed. */
  allowedHosts: string;
}
