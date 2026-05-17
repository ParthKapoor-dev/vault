export type Items = Item[];
export type Item = Directory | VaultFile;

export type Visibility = "public" | "private";

export interface Directory {
  type: "Directory";
  slug: string;
  title: string;
  visibility: Visibility;
  createdAt: number;
}

export interface VaultFile {
  type: "File";
  slug: string;
  title: string;
  visibility: Visibility;
  createdAt: number;
}
